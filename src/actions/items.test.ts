import { describe, expect, it, vi } from "vitest";

import { createItem, deleteItem, updateItem } from "@/actions/items";
import {
  createItem as createItemQuery,
  deleteItem as deleteItemQuery,
  updateItem as updateItemQuery,
} from "@/lib/db/items";

vi.mock("@/lib/session", () => ({ requireUserId: vi.fn().mockResolvedValue("user-1") }));
vi.mock("@/lib/db/items", () => ({
  createItem: vi.fn(),
  updateItem: vi.fn(),
  deleteItem: vi.fn(),
}));

const input = {
  title: "  useAuth Hook ",
  description: "",
  content: "export function useAuth() {}",
  language: "typescript",
  url: null,
  tags: ["auth", "react"],
};

describe("updateItem", () => {
  it("returns field errors without touching the database when validation fails", async () => {
    const result = await updateItem("item-1", { ...input, title: " " });

    expect(result.success).toBe(false);
    expect(result.data?.fieldErrors?.title).toBe("Title is required");
    expect(updateItemQuery).not.toHaveBeenCalled();
  });

  it("returns not found when the user has no such item", async () => {
    vi.mocked(updateItemQuery).mockResolvedValue(null);

    const result = await updateItem("someone-elses-item", input);

    expect(result).toEqual({ success: false, error: "Item not found." });
  });

  it("saves the parsed data for the signed-in user and returns the item", async () => {
    const item = { id: "item-1", title: "useAuth Hook" };
    vi.mocked(updateItemQuery).mockResolvedValue(item as never);

    const result = await updateItem("item-1", input);

    expect(result).toEqual({ success: true, data: { item } });
    expect(updateItemQuery).toHaveBeenCalledWith("user-1", "item-1", {
      ...input,
      title: "useAuth Hook",
      description: null,
    });
  });

  it("returns a friendly error when the database fails", async () => {
    vi.mocked(updateItemQuery).mockRejectedValue(new Error("connection lost"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await updateItem("item-1", input);

    expect(result).toEqual({
      success: false,
      error: "Couldn't save your changes. Please try again.",
    });
  });
});

describe("createItem", () => {
  const createInput = { ...input, type: "snippet" as const };

  it("returns field errors without touching the database when validation fails", async () => {
    const result = await createItem({ ...createInput, type: "link", url: "" });

    expect(result.success).toBe(false);
    expect(result.data?.fieldErrors?.url).toBe("URL is required");
    expect(createItemQuery).not.toHaveBeenCalled();
  });

  it("returns an error when the item type doesn't exist", async () => {
    vi.mocked(createItemQuery).mockResolvedValue(null);

    const result = await createItem(createInput);

    expect(result).toEqual({ success: false, error: "That item type isn't available." });
  });

  it("creates the parsed item for the signed-in user and returns its id", async () => {
    vi.mocked(createItemQuery).mockResolvedValue("item-9");

    const result = await createItem(createInput);

    expect(result).toEqual({ success: true, data: { id: "item-9" } });
    expect(createItemQuery).toHaveBeenCalledWith("user-1", {
      ...createInput,
      title: "useAuth Hook",
      description: null,
    });
  });

  it("returns a friendly error when the database fails", async () => {
    vi.mocked(createItemQuery).mockRejectedValue(new Error("connection lost"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await createItem(createInput);

    expect(result).toEqual({
      success: false,
      error: "Couldn't create this item. Please try again.",
    });
  });
});

describe("deleteItem", () => {
  it("rejects an empty id without touching the database", async () => {
    const result = await deleteItem("");

    expect(result).toEqual({ success: false, error: "Item not found." });
    expect(deleteItemQuery).not.toHaveBeenCalled();
  });

  it("returns not found when the user has no such item", async () => {
    vi.mocked(deleteItemQuery).mockResolvedValue(false);

    const result = await deleteItem("someone-elses-item");

    expect(result).toEqual({ success: false, error: "Item not found." });
  });

  it("deletes the item for the signed-in user", async () => {
    vi.mocked(deleteItemQuery).mockResolvedValue(true);

    const result = await deleteItem("item-1");

    expect(result).toEqual({ success: true });
    expect(deleteItemQuery).toHaveBeenCalledWith("user-1", "item-1");
  });

  it("returns a friendly error when the database fails", async () => {
    vi.mocked(deleteItemQuery).mockRejectedValue(new Error("connection lost"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await deleteItem("item-1");

    expect(result).toEqual({
      success: false,
      error: "Couldn't delete this item. Please try again.",
    });
  });
});
