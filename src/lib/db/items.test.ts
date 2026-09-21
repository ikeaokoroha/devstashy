import { describe, expect, it, vi } from "vitest";

import { getItemDetail } from "@/lib/db/items";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({ prisma: { item: { findFirst: vi.fn() } } }));

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
