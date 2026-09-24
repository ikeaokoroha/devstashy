import { describe, expect, it, vi } from "vitest";

import {
  createCollection,
  filterOwnedCollectionIds,
  getAllCollections,
  getCollectionDetail,
  getPickerCollections,
} from "@/lib/db/collections";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: { collection: { create: vi.fn(), findMany: vi.fn(), findFirst: vi.fn() } },
}));

describe("getPickerCollections", () => {
  it("returns the user's collections by name", async () => {
    const collections = [
      { id: "col-1", name: "AI Workflows" },
      { id: "col-2", name: "React Patterns" },
    ];
    vi.mocked(prisma.collection.findMany).mockResolvedValue(collections as never);

    expect(await getPickerCollections("user-1")).toEqual(collections);
    expect(prisma.collection.findMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
  });
});

describe("filterOwnedCollectionIds", () => {
  it("returns nothing without a query when no ids were selected", async () => {
    expect(await filterOwnedCollectionIds("user-1", [])).toEqual([]);
    expect(prisma.collection.findMany).not.toHaveBeenCalled();
  });

  it("drops ids that aren't the user's own collections", async () => {
    vi.mocked(prisma.collection.findMany).mockResolvedValue([{ id: "col-1" }] as never);

    const owned = await filterOwnedCollectionIds("user-1", ["col-1", "someone-elses"]);

    expect(owned).toEqual(["col-1"]);
    expect(prisma.collection.findMany).toHaveBeenCalledWith({
      where: { userId: "user-1", id: { in: ["col-1", "someone-elses"] } },
      select: { id: true },
    });
  });
});

describe("getAllCollections", () => {
  it("maps each row to the card's shape with its types ranked by use", async () => {
    const snippet = { id: "type-1", name: "snippet" };
    const note = { id: "type-2", name: "note" };
    vi.mocked(prisma.collection.findMany).mockResolvedValue([
      {
        id: "col-1",
        name: "React Patterns",
        description: "Hooks and components",
        isFavorite: true,
        // One note, two snippets: snippet is dominant and sets the border colour.
        items: [{ item: { itemType: note } }, ...Array(2).fill({ item: { itemType: snippet } })],
        _count: { items: 3 },
      },
    ] as never);

    expect(await getAllCollections("user-1")).toEqual([
      {
        id: "col-1",
        name: "React Patterns",
        description: "Hooks and components",
        isFavorite: true,
        itemCount: 3,
        itemTypes: [snippet, note],
      },
    ]);
    expect(prisma.collection.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-1" },
        orderBy: [{ isFavorite: "desc" }, { updatedAt: "desc" }],
      })
    );
  });

  it("returns an empty collection with no types", async () => {
    vi.mocked(prisma.collection.findMany).mockResolvedValue([
      {
        id: "col-2",
        name: "Inbox",
        description: null,
        isFavorite: false,
        items: [],
        _count: { items: 0 },
      },
    ] as never);

    const [collection] = await getAllCollections("user-1");

    expect(collection.itemCount).toBe(0);
    expect(collection.itemTypes).toEqual([]);
  });
});

describe("getCollectionDetail", () => {
  it("scopes the lookup to the user, so another user's id finds nothing", async () => {
    vi.mocked(prisma.collection.findFirst).mockResolvedValue(null);

    expect(await getCollectionDetail("user-1", "someone-elses")).toBeNull();
    expect(prisma.collection.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "someone-elses", userId: "user-1" },
      })
    );
  });

  it("returns the collection's own row", async () => {
    const collection = {
      id: "col-1",
      name: "React Patterns",
      description: "Hooks and components",
      isFavorite: true,
      createdAt: new Date("2026-01-15T10:00:00Z"),
    };
    vi.mocked(prisma.collection.findFirst).mockResolvedValue(collection as never);

    expect(await getCollectionDetail("user-1", "col-1")).toEqual(collection);
  });
});

describe("createCollection", () => {
  it("connects the collection to the user and returns the new id", async () => {
    vi.mocked(prisma.collection.create).mockResolvedValue({ id: "col-1" } as never);

    const id = await createCollection("user-1", {
      name: "React Patterns",
      description: "Hooks and components",
    });

    expect(id).toBe("col-1");
    expect(prisma.collection.create).toHaveBeenCalledWith({
      data: {
        name: "React Patterns",
        description: "Hooks and components",
        user: { connect: { id: "user-1" } },
      },
      select: { id: true },
    });
  });

  it("stores a null description", async () => {
    vi.mocked(prisma.collection.create).mockResolvedValue({ id: "col-2" } as never);

    await createCollection("user-1", { name: "Inbox", description: null });

    expect(prisma.collection.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ description: null }),
      })
    );
  });
});
