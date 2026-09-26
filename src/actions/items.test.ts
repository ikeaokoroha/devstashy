import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createItem,
  deleteItem,
  toggleItemFavorite,
  toggleItemPin,
  updateItem,
} from "@/actions/items";
import {
  countItems,
  createItem as createItemQuery,
  deleteItem as deleteItemQuery,
  setItemFavorite,
  setItemPinned,
  updateItem as updateItemQuery,
} from "@/lib/db/items";
import { deleteObject } from "@/lib/r2";
import { FREE_ITEM_LIMIT, PLAN_ERRORS } from "@/lib/usage-limits";

// Mutable so each case can pick the plan and whether gating is on. Every case
// starts as a Pro user with gating on, so only the plan cases see a limit.
const plan = vi.hoisted(() => ({ isPro: true, gating: true }));

vi.mock("@/lib/session", () => ({
  requireUserId: vi.fn().mockResolvedValue("user-1"),
  requireSessionUser: vi.fn(async () => ({ id: "user-1", isPro: plan.isPro })),
}));
vi.mock("@/lib/feature-flags", () => ({
  get PRO_GATING_ENABLED() {
    return plan.gating;
  },
}));
vi.mock("@/lib/r2", () => ({
  // The real one only matches URLs on the configured public host, and only
  // those under the user's own key prefix.
  getOwnedObjectKeyFromUrl: vi.fn((url: string, userId: string) => {
    if (!url.startsWith("https://pub-test.r2.dev/")) return null;
    const key = url.slice("https://pub-test.r2.dev/".length);
    return key.startsWith(`${userId}/`) ? key : null;
  }),
  deleteObject: vi.fn(),
}));
vi.mock("@/lib/db/items", () => ({
  countItems: vi.fn(),
  createItem: vi.fn(),
  updateItem: vi.fn(),
  deleteItem: vi.fn(),
  setItemFavorite: vi.fn(),
  setItemPinned: vi.fn(),
}));

beforeEach(() => {
  plan.isPro = true;
  plan.gating = true;
  vi.mocked(countItems).mockResolvedValue(0);
});

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
      collectionIds: [],
    });
  });

  it("passes the picked collections through to the query", async () => {
    vi.mocked(updateItemQuery).mockResolvedValue({ id: "item-1" } as never);

    await updateItem("item-1", { ...input, collectionIds: [" col-1 ", "col-1", "col-2"] });

    expect(updateItemQuery).toHaveBeenCalledWith(
      "user-1",
      "item-1",
      expect.objectContaining({ collectionIds: ["col-1", "col-2"] })
    );
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
      fileUrl: null,
      fileName: null,
      fileSize: null,
      collectionIds: [],
    });
  });

  it("passes the picked collections through to the query", async () => {
    vi.mocked(createItemQuery).mockResolvedValue("item-9");

    await createItem({ ...createInput, collectionIds: ["col-1", " col-2 "] });

    expect(createItemQuery).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ collectionIds: ["col-1", "col-2"] })
    );
  });

  it("requires a file for a file item", async () => {
    const result = await createItem({ ...createInput, type: "image" });

    expect(result.success).toBe(false);
    expect(result.data?.fieldErrors?.fileUrl).toBe("Upload a file");
    expect(createItemQuery).not.toHaveBeenCalled();
  });

  // The URL comes from the browser, so an item must not be able to point at
  // anything outside our own bucket.
  it("rejects a file URL that isn't in our bucket", async () => {
    const result = await createItem({
      ...createInput,
      type: "image",
      fileUrl: "https://evil.example.com/payload.svg",
      fileName: "payload.svg",
      fileSize: 1024,
    });

    expect(result.success).toBe(false);
    expect(result.data?.fieldErrors?.fileUrl).toBe("Upload a file");
    expect(createItemQuery).not.toHaveBeenCalled();
  });

  // The bucket is public, so a signed-in user can hold another user's file URL.
  // Attaching it to an item would let them delete that object by deleting the item.
  it("rejects a file URL belonging to another user", async () => {
    const result = await createItem({
      ...createInput,
      type: "image",
      fileUrl: "https://pub-test.r2.dev/user-2/abc.png",
      fileName: "abc.png",
      fileSize: 1024,
    });

    expect(result.success).toBe(false);
    expect(result.data?.fieldErrors?.fileUrl).toBe("Upload a file");
    expect(createItemQuery).not.toHaveBeenCalled();
  });

  it("stores a file item whose URL is in our bucket", async () => {
    vi.mocked(createItemQuery).mockResolvedValue("item-9");

    const result = await createItem({
      ...createInput,
      type: "image",
      fileUrl: "https://pub-test.r2.dev/user-1/abc.png",
      fileName: "logo.png",
      fileSize: 2048,
    });

    expect(result).toEqual({ success: true, data: { id: "item-9" } });
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

describe("createItem plan limits", () => {
  const createInput = { ...input, type: "snippet" as const };
  const imageInput = {
    ...createInput,
    type: "image" as const,
    fileUrl: "https://pub-test.r2.dev/user-1/abc.png",
    fileName: "logo.png",
    fileSize: 2048,
  };

  beforeEach(() => {
    plan.isPro = false;
    vi.mocked(createItemQuery).mockResolvedValue("item-9");
  });

  it("rejects a Pro type on the Free plan before counting or saving", async () => {
    const result = await createItem(imageInput);

    expect(result).toEqual({ success: false, error: PLAN_ERRORS.proType });
    expect(countItems).not.toHaveBeenCalled();
    expect(createItemQuery).not.toHaveBeenCalled();
  });

  it("rejects a new item at the Free plan's limit", async () => {
    vi.mocked(countItems).mockResolvedValue(FREE_ITEM_LIMIT);

    const result = await createItem(createInput);

    expect(result).toEqual({ success: false, error: PLAN_ERRORS.itemLimit });
    expect(countItems).toHaveBeenCalledWith("user-1");
    expect(createItemQuery).not.toHaveBeenCalled();
  });

  it("creates an item below the Free plan's limit", async () => {
    vi.mocked(countItems).mockResolvedValue(FREE_ITEM_LIMIT - 1);

    const result = await createItem(createInput);

    expect(result).toEqual({ success: true, data: { id: "item-9" } });
  });

  it("lets a Pro user past the limit and create a Pro type", async () => {
    plan.isPro = true;
    vi.mocked(countItems).mockResolvedValue(FREE_ITEM_LIMIT + 10);

    expect(await createItem(createInput)).toEqual({ success: true, data: { id: "item-9" } });
    expect(await createItem(imageInput)).toEqual({ success: true, data: { id: "item-9" } });
  });

  it("allows everything on the Free plan with gating off", async () => {
    plan.gating = false;
    vi.mocked(countItems).mockResolvedValue(FREE_ITEM_LIMIT + 10);

    expect(await createItem(createInput)).toEqual({ success: true, data: { id: "item-9" } });
    expect(await createItem(imageInput)).toEqual({ success: true, data: { id: "item-9" } });
  });

  it("returns the generic error when the count fails", async () => {
    vi.mocked(countItems).mockRejectedValue(new Error("connection lost"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await createItem(createInput);

    expect(result).toEqual({
      success: false,
      error: "Couldn't create this item. Please try again.",
    });
    expect(createItemQuery).not.toHaveBeenCalled();
  });
});

describe("deleteItem", () => {
  it("rejects an empty id without touching the database", async () => {
    const result = await deleteItem("");

    expect(result).toEqual({ success: false, error: "Item not found." });
    expect(deleteItemQuery).not.toHaveBeenCalled();
  });

  it("returns not found when the user has no such item", async () => {
    vi.mocked(deleteItemQuery).mockResolvedValue({ deleted: false, fileUrl: null });

    const result = await deleteItem("someone-elses-item");

    expect(result).toEqual({ success: false, error: "Item not found." });
  });

  it("deletes the item for the signed-in user", async () => {
    vi.mocked(deleteItemQuery).mockResolvedValue({ deleted: true, fileUrl: null });

    const result = await deleteItem("item-1");

    expect(result).toEqual({ success: true });
    expect(deleteItemQuery).toHaveBeenCalledWith("user-1", "item-1");
    expect(deleteObject).not.toHaveBeenCalled();
  });

  it("removes the stored file from R2 after deleting a file item", async () => {
    vi.mocked(deleteItemQuery).mockResolvedValue({
      deleted: true,
      fileUrl: "https://pub-test.r2.dev/user-1/abc.pdf",
    });

    expect(await deleteItem("item-1")).toEqual({ success: true });
    expect(deleteObject).toHaveBeenCalledWith("user-1/abc.pdf");
  });

  it("leaves a file URL outside our bucket alone", async () => {
    vi.mocked(deleteItemQuery).mockResolvedValue({
      deleted: true,
      fileUrl: "https://evil.example.com/abc.pdf",
    });

    expect(await deleteItem("item-1")).toEqual({ success: true });
    expect(deleteObject).not.toHaveBeenCalled();
  });

  // A row written before createItem checked ownership could still hold another
  // user's key. The item goes, the object stays.
  it("leaves another user's object in place", async () => {
    vi.mocked(deleteItemQuery).mockResolvedValue({
      deleted: true,
      fileUrl: "https://pub-test.r2.dev/user-2/abc.pdf",
    });

    expect(await deleteItem("item-1")).toEqual({ success: true });
    expect(deleteObject).not.toHaveBeenCalled();
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

describe("toggleItemFavorite", () => {
  it("rejects an empty id without touching the database", async () => {
    const result = await toggleItemFavorite("", true);

    expect(result).toEqual({ success: false, error: "Item not found." });
    expect(setItemFavorite).not.toHaveBeenCalled();
  });

  // The action passes the state the UI is already showing straight through, so
  // the database never has to read the row to flip it.
  it("saves the requested state for the signed-in user", async () => {
    vi.mocked(setItemFavorite).mockResolvedValue(true);

    expect(await toggleItemFavorite("item-1", true)).toEqual({ success: true });
    expect(setItemFavorite).toHaveBeenCalledWith("user-1", "item-1", true);
  });

  it("passes false through when unfavoriting", async () => {
    vi.mocked(setItemFavorite).mockResolvedValue(true);

    await toggleItemFavorite("item-1", false);

    expect(setItemFavorite).toHaveBeenCalledWith("user-1", "item-1", false);
  });

  it("reports not found when the item isn't the user's", async () => {
    vi.mocked(setItemFavorite).mockResolvedValue(false);

    expect(await toggleItemFavorite("someone-elses-item", true)).toEqual({
      success: false,
      error: "Item not found.",
    });
  });

  it("returns a friendly error when the database fails", async () => {
    vi.mocked(setItemFavorite).mockRejectedValue(new Error("connection lost"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(await toggleItemFavorite("item-1", true)).toEqual({
      success: false,
      error: "Couldn't update this item. Please try again.",
    });
  });
});

describe("toggleItemPin", () => {
  it("rejects an empty id without touching the database", async () => {
    const result = await toggleItemPin("", true);

    expect(result).toEqual({ success: false, error: "Item not found." });
    expect(setItemPinned).not.toHaveBeenCalled();
  });

  // The action passes the state the UI is already showing straight through, so
  // the database never has to read the row to flip it.
  it("saves the requested state for the signed-in user", async () => {
    vi.mocked(setItemPinned).mockResolvedValue(true);

    expect(await toggleItemPin("item-1", true)).toEqual({ success: true });
    expect(setItemPinned).toHaveBeenCalledWith("user-1", "item-1", true);
  });

  it("passes false through when unpinning", async () => {
    vi.mocked(setItemPinned).mockResolvedValue(true);

    await toggleItemPin("item-1", false);

    expect(setItemPinned).toHaveBeenCalledWith("user-1", "item-1", false);
  });

  it("reports not found when the item isn't the user's", async () => {
    vi.mocked(setItemPinned).mockResolvedValue(false);

    expect(await toggleItemPin("someone-elses-item", true)).toEqual({
      success: false,
      error: "Item not found.",
    });
  });

  it("returns a friendly error when the database fails", async () => {
    vi.mocked(setItemPinned).mockRejectedValue(new Error("connection lost"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(await toggleItemPin("item-1", true)).toEqual({
      success: false,
      error: "Couldn't update this item. Please try again.",
    });
  });

  // Pinning must not reach the favorite query, which writes a different column.
  it("never touches the favorite flag", async () => {
    vi.mocked(setItemPinned).mockResolvedValue(true);

    await toggleItemPin("item-1", true);

    expect(setItemFavorite).not.toHaveBeenCalled();
  });
});
