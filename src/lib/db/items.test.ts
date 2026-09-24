import { describe, expect, it, vi } from "vitest";

import {
  createItem,
  deleteItem,
  getItemDetail,
  getItemFile,
  getItemsByCollection,
  getSearchItems,
  updateItem,
} from "@/lib/db/items";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    item: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    itemType: { findFirst: vi.fn() },
    // Unlinking a dropped collection, plus the ownership check both item
    // writes run their selection through.
    itemCollection: { deleteMany: vi.fn() },
    collection: { findMany: vi.fn() },
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
    collectionIds: [],
  };

  function mockExistingItem(typeName: string, collectionIds: string[] = []) {
    vi.mocked(prisma.item.findFirst).mockResolvedValue({
      itemType: { name: typeName },
      collections: collectionIds.map((collectionId) => ({ collectionId })),
    } as never);
    vi.mocked(prisma.item.update)
      .mockResolvedValueOnce({ id: "item-1" } as never)
      .mockResolvedValueOnce(row as never);
  }

  // The ids the ownership check lets through, in selection order.
  function mockOwnedCollections(ids: string[]) {
    vi.mocked(prisma.collection.findMany).mockResolvedValue(ids.map((id) => ({ id })) as never);
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

  it("links only the collections the user owns", async () => {
    mockExistingItem("snippet");
    mockOwnedCollections(["col-1"]);

    await updateItem("user-1", "item-1", {
      ...data,
      collectionIds: ["col-1", "someone-elses"],
    });

    expect(prisma.collection.findMany).toHaveBeenCalledWith({
      where: { userId: "user-1", id: { in: ["col-1", "someone-elses"] } },
      select: { id: true },
    });
    const [, connect] = vi.mocked(prisma.item.update).mock.calls.map(([args]) => args);
    expect(connect.data.collections).toEqual({
      create: [{ collection: { connect: { id: "col-1" } } }],
    });
  });

  it("adds and removes only the difference, leaving unchanged links alone", async () => {
    mockExistingItem("snippet", ["col-1", "col-2"]);
    mockOwnedCollections(["col-2", "col-3"]);

    await updateItem("user-1", "item-1", { ...data, collectionIds: ["col-2", "col-3"] });

    // col-2 is in both, so it's neither removed nor re-added and keeps its addedAt.
    expect(prisma.itemCollection.deleteMany).toHaveBeenCalledWith({
      where: { itemId: "item-1", collectionId: { in: ["col-1"] } },
    });
    const [, connect] = vi.mocked(prisma.item.update).mock.calls.map(([args]) => args);
    expect(connect.data.collections).toEqual({
      create: [{ collection: { connect: { id: "col-3" } } }],
    });
  });

  it("removes every link when the selection is cleared", async () => {
    mockExistingItem("snippet", ["col-1", "col-2"]);

    await updateItem("user-1", "item-1", { ...data, collectionIds: [] });

    expect(prisma.collection.findMany).not.toHaveBeenCalled();
    expect(prisma.itemCollection.deleteMany).toHaveBeenCalledWith({
      where: { itemId: "item-1", collectionId: { in: ["col-1", "col-2"] } },
    });
    // Nothing to add, so the write leaves the relation out altogether.
    const [, connect] = vi.mocked(prisma.item.update).mock.calls.map(([args]) => args);
    expect(connect.data).not.toHaveProperty("collections");
  });
});

describe("createItem", () => {
  const data = {
    type: "snippet" as const,
    title: "useAuth Hook",
    description: null,
    content: "export function useAuth() {}",
    language: "typescript",
    url: "https://example.com",
    fileUrl: null,
    fileName: null,
    fileSize: null,
    tags: ["auth", "hooks"],
    collectionIds: [],
  };

  function mockSystemType() {
    vi.mocked(prisma.itemType.findFirst).mockResolvedValue({ id: "type-1" } as never);
    vi.mocked(prisma.item.create).mockResolvedValue({ id: "item-9" } as never);
  }

  it("returns null without writing when the system type doesn't exist", async () => {
    vi.mocked(prisma.itemType.findFirst).mockResolvedValue(null);

    expect(await createItem("user-1", data)).toBeNull();
    expect(prisma.itemType.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { name: "snippet", isSystem: true } })
    );
    expect(prisma.item.create).not.toHaveBeenCalled();
  });

  it("creates the item for the user with its type and returns the id", async () => {
    mockSystemType();

    expect(await createItem("user-1", data)).toBe("item-9");

    const [{ data: created }] = vi.mocked(prisma.item.create).mock.calls[0];
    expect(created).toMatchObject({
      title: "useAuth Hook",
      description: null,
      contentType: "TEXT",
      user: { connect: { id: "user-1" } },
      itemType: { connect: { id: "type-1" } },
      tags: {
        connectOrCreate: [
          { where: { name: "auth" }, create: { name: "auth" } },
          { where: { name: "hooks" }, create: { name: "hooks" } },
        ],
      },
    });
  });

  it("only writes the fields the type uses", async () => {
    mockSystemType();

    await createItem("user-1", data);

    const [{ data: created }] = vi.mocked(prisma.item.create).mock.calls[0];
    expect(created).toMatchObject({ content: data.content, language: "typescript" });
    expect(created).not.toHaveProperty("url");
  });

  it("stores file items as FILE content with the uploaded file", async () => {
    mockSystemType();

    await createItem("user-1", {
      ...data,
      type: "image",
      fileUrl: "https://pub-test.r2.dev/user-1/abc.png",
      fileName: "logo.png",
      fileSize: 2048,
    });

    const [{ data: created }] = vi.mocked(prisma.item.create).mock.calls[0];
    expect(created).toMatchObject({
      contentType: "FILE",
      fileUrl: "https://pub-test.r2.dev/user-1/abc.png",
      fileName: "logo.png",
      fileSize: 2048,
    });
    expect(created).not.toHaveProperty("content");
    expect(created).not.toHaveProperty("url");
  });

  it("ignores file fields on a type that doesn't take a file", async () => {
    mockSystemType();

    await createItem("user-1", {
      ...data,
      fileUrl: "https://pub-test.r2.dev/user-1/abc.png",
      fileName: "logo.png",
      fileSize: 2048,
    });

    const [{ data: created }] = vi.mocked(prisma.item.create).mock.calls[0];
    expect(created).not.toHaveProperty("fileUrl");
    expect(created).toMatchObject({ contentType: "TEXT" });
  });

  it("stores links as URL content with no content or language", async () => {
    mockSystemType();

    await createItem("user-1", { ...data, type: "link" });

    const [{ data: created }] = vi.mocked(prisma.item.create).mock.calls[0];
    expect(created).toMatchObject({ contentType: "URL", url: "https://example.com" });
    expect(created).not.toHaveProperty("content");
    expect(created).not.toHaveProperty("language");
  });

  it("links the new item to the collections the user owns", async () => {
    mockSystemType();
    vi.mocked(prisma.collection.findMany).mockResolvedValue([{ id: "col-1" }] as never);

    await createItem("user-1", { ...data, collectionIds: ["col-1", "someone-elses"] });

    const [{ data: created }] = vi.mocked(prisma.item.create).mock.calls[0];
    expect(prisma.collection.findMany).toHaveBeenCalledWith({
      where: { userId: "user-1", id: { in: ["col-1", "someone-elses"] } },
      select: { id: true },
    });
    expect(created.collections).toEqual({
      create: [{ collection: { connect: { id: "col-1" } } }],
    });
  });

  it("creates no links when no collection was picked", async () => {
    mockSystemType();

    await createItem("user-1", data);

    const [{ data: created }] = vi.mocked(prisma.item.create).mock.calls[0];
    expect(prisma.collection.findMany).not.toHaveBeenCalled();
    expect(created).not.toHaveProperty("collections");
  });
});

describe("getItemsByCollection", () => {
  it("scopes the query to the user and the collection, pinned items first", async () => {
    vi.mocked(prisma.item.findMany).mockResolvedValue([]);

    expect(await getItemsByCollection("user-1", "col-1")).toEqual([]);
    expect(prisma.item.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-1", collections: { some: { collectionId: "col-1" } } },
        orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
      })
    );
  });

  it("flattens each item's tags to names for the card", async () => {
    vi.mocked(prisma.item.findMany).mockResolvedValue([
      {
        id: "item-1",
        title: "useAuth Hook",
        itemType: { id: "type-1", name: "snippet" },
        tags: [{ name: "auth" }, { name: "react" }],
      },
    ] as never);

    const [item] = await getItemsByCollection("user-1", "col-1");

    expect(item.tags).toEqual(["auth", "react"]);
    expect(item.itemType).toEqual({ id: "type-1", name: "snippet" });
  });
});

describe("getItemFile", () => {
  it("scopes the lookup to the user and to file items", async () => {
    vi.mocked(prisma.item.findFirst).mockResolvedValue(null);

    expect(await getItemFile("user-1", "item-1")).toBeNull();
    expect(prisma.item.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "item-1", userId: "user-1", contentType: "FILE" },
      })
    );
  });

  it("returns the stored file", async () => {
    vi.mocked(prisma.item.findFirst).mockResolvedValue({
      fileUrl: "https://pub-test.r2.dev/user-1/abc.pdf",
      fileName: "notes.pdf",
    } as never);

    expect(await getItemFile("user-1", "item-1")).toEqual({
      fileUrl: "https://pub-test.r2.dev/user-1/abc.pdf",
      fileName: "notes.pdf",
    });
  });

  it("returns null for a row with no file recorded", async () => {
    vi.mocked(prisma.item.findFirst).mockResolvedValue({
      fileUrl: null,
      fileName: "notes.pdf",
    } as never);

    expect(await getItemFile("user-1", "item-1")).toBeNull();
  });
});

describe("deleteItem", () => {
  it("scopes the delete to the user and reports a deleted item", async () => {
    vi.mocked(prisma.item.findFirst).mockResolvedValue({ fileUrl: null } as never);
    vi.mocked(prisma.item.deleteMany).mockResolvedValue({ count: 1 });

    expect(await deleteItem("user-1", "item-1")).toEqual({ deleted: true, fileUrl: null });
    expect(prisma.item.deleteMany).toHaveBeenCalledWith({
      where: { id: "item-1", userId: "user-1" },
    });
  });

  it("returns the stored file so the caller can remove it from R2", async () => {
    vi.mocked(prisma.item.findFirst).mockResolvedValue({
      fileUrl: "https://pub-test.r2.dev/user-1/abc.pdf",
    } as never);
    vi.mocked(prisma.item.deleteMany).mockResolvedValue({ count: 1 });

    expect(await deleteItem("user-1", "item-1")).toEqual({
      deleted: true,
      fileUrl: "https://pub-test.r2.dev/user-1/abc.pdf",
    });
  });

  it("reports nothing deleted when the user has no item with that id", async () => {
    vi.mocked(prisma.item.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.item.deleteMany).mockResolvedValue({ count: 0 });

    expect(await deleteItem("user-1", "someone-elses-item")).toEqual({
      deleted: false,
      fileUrl: null,
    });
  });
});

describe("getSearchItems", () => {
  it("scopes the query to the user, newest first, capped at the limit", async () => {
    vi.mocked(prisma.item.findMany).mockResolvedValue([]);

    expect(await getSearchItems("user-1", 500)).toEqual([]);
    expect(prisma.item.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-1" },
        orderBy: { updatedAt: "desc" },
        take: 500,
      })
    );
  });

  it("returns the palette's fields with the content cut down to a preview", async () => {
    vi.mocked(prisma.item.findMany).mockResolvedValue([
      {
        id: "item-1",
        title: "useAuth Hook",
        isFavorite: true,
        isPinned: false,
        content: "export function useAuth() {\n  return null;\n}",
        itemType: { id: "type-1", name: "snippet" },
      },
    ] as never);

    const [item] = await getSearchItems("user-1", 500);

    expect(item).toEqual({
      id: "item-1",
      title: "useAuth Hook",
      isFavorite: true,
      isPinned: false,
      itemType: { id: "type-1", name: "snippet" },
      preview: "export function useAuth() { return null; }",
    });
  });

  it("previews an item with no content as null", async () => {
    vi.mocked(prisma.item.findMany).mockResolvedValue([
      {
        id: "item-1",
        title: "Design System",
        isFavorite: false,
        isPinned: false,
        content: null,
        itemType: { id: "type-7", name: "link" },
      },
    ] as never);

    const [item] = await getSearchItems("user-1", 500);

    expect(item.preview).toBeNull();
  });
});
