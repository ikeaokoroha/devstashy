import { describe, expect, it, vi } from "vitest";

import { getItemDetail, updateItem } from "@/lib/db/items";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    item: { findFirst: vi.fn(), update: vi.fn() },
    // The batch form: the updates are already-started promises, resolved in order.
    $transaction: vi.fn((operations: Promise<unknown>[]) => Promise.all(operations)),
  },
}));

const createdAt = new Date("2026-01-15T10:00:00Z");

const row = {
  id: "item-1",
  title: "useAuth Hook",
  description: "Custom authentication hook",
  contentType: "TEXT",
  content: "export function useAuth() {}",
  url: null,
  fileUrl: null,
  fileName: null,
  fileSize: null,
  language: "typescript",
  isFavorite: true,
  isPinned: false,
  createdAt,
  updatedAt: createdAt,
  itemType: { id: "type-1", name: "snippet" },
  tags: [{ name: "auth" }, { name: "react" }],
  collections: [{ collection: { id: "col-1", name: "React Patterns" } }],
};

describe("getItemDetail", () => {
  it("scopes the lookup to the user", async () => {
    vi.mocked(prisma.item.findFirst).mockResolvedValue(null);

    await getItemDetail("user-1", "item-1");

    expect(prisma.item.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "item-1", userId: "user-1" } })
    );
  });

  it("returns null when the user has no such item", async () => {
    vi.mocked(prisma.item.findFirst).mockResolvedValue(null);

    expect(await getItemDetail("user-1", "missing")).toBeNull();
  });

  it("flattens tags to names and collections to id and name", async () => {
    vi.mocked(prisma.item.findFirst).mockResolvedValue(row as never);

    const item = await getItemDetail("user-1", "item-1");

    expect(item?.tags).toEqual(["auth", "react"]);
    expect(item?.collections).toEqual([{ id: "col-1", name: "React Patterns" }]);
    expect(item).toMatchObject({ id: "item-1", language: "typescript", createdAt });
  });
});

describe("updateItem", () => {
  const data = {
    title: "useAuth Hook",
    description: null,
    content: "export function useAuth() {}",
    language: "typescript",
    url: "https://example.com",
    tags: ["auth", "hooks"],
  };

  function mockExistingItem(typeName: string) {
    vi.mocked(prisma.item.findFirst).mockResolvedValue({ itemType: { name: typeName } } as never);
    vi.mocked(prisma.item.update)
      .mockResolvedValueOnce({ id: "item-1" } as never)
      .mockResolvedValueOnce(row as never);
  }

  it("returns null without writing when the user has no such item", async () => {
    vi.mocked(prisma.item.findFirst).mockResolvedValue(null);

    expect(await updateItem("user-1", "missing", data)).toBeNull();
    expect(prisma.item.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "missing", userId: "user-1" } })
    );
    expect(prisma.item.update).not.toHaveBeenCalled();
  });

  it("clears the tags, then connects or creates the new ones", async () => {
    mockExistingItem("snippet");

    await updateItem("user-1", "item-1", data);

    const [clear, connect] = vi.mocked(prisma.item.update).mock.calls.map(([args]) => args);
    expect(clear.where).toEqual({ id: "item-1", userId: "user-1" });
    expect(clear.data.tags).toEqual({ set: [] });
    expect(connect.where).toEqual({ id: "item-1", userId: "user-1" });
    expect(connect.data.tags).toEqual({
      connectOrCreate: [
        { where: { name: "auth" }, create: { name: "auth" } },
        { where: { name: "hooks" }, create: { name: "hooks" } },
      ],
    });
  });

  it("only writes the fields the item's type uses", async () => {
    mockExistingItem("snippet");

    await updateItem("user-1", "item-1", data);

    const [clear] = vi.mocked(prisma.item.update).mock.calls[0];
    expect(clear.data).toMatchObject({ content: data.content, language: "typescript" });
    expect(clear.data).not.toHaveProperty("url");
  });

  it("returns the updated item as an ItemDetail", async () => {
    mockExistingItem("snippet");

    const item = await updateItem("user-1", "item-1", data);

    expect(item?.tags).toEqual(["auth", "react"]);
    expect(item?.collections).toEqual([{ id: "col-1", name: "React Patterns" }]);
  });
});
