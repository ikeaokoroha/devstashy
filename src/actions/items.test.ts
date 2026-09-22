import { describe, expect, it, vi } from "vitest";

import { updateItem } from "@/actions/items";
import { updateItem as updateItemQuery } from "@/lib/db/items";

vi.mock("@/lib/session", () => ({ requireUserId: vi.fn().mockResolvedValue("user-1") }));
vi.mock("@/lib/db/items", () => ({ updateItem: vi.fn() }));

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
