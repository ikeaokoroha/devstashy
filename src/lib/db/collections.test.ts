import { describe, expect, it, vi } from "vitest";

import {
  createCollection,
  filterOwnedCollectionIds,
  getPickerCollections,
} from "@/lib/db/collections";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: { collection: { create: vi.fn(), findMany: vi.fn() } },
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
