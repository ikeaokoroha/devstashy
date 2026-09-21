import type { Prisma } from "@/generated/prisma/client";
import { SYSTEM_ITEM_TYPE_ORDER } from "@/lib/item-types";
import { prisma } from "@/lib/prisma";
import type { ItemStats, ItemTypeWithCount, ItemWithType } from "@/types/dashboard";
import type { ItemDetail } from "@/types/items";

// Only the fields the dashboard item cards render.
const ITEM_CARD_SELECT = {
  id: true,
  title: true,
  description: true,
  isFavorite: true,
  isPinned: true,
  updatedAt: true,
  itemType: { select: { id: true, name: true } },
  tags: { select: { name: true }, orderBy: { name: "asc" } },
} satisfies Prisma.ItemSelect;

type ItemCardRow = Prisma.ItemGetPayload<{ select: typeof ITEM_CARD_SELECT }>;

function toItemWithType({ tags, ...item }: ItemCardRow): ItemWithType {
  return { ...item, tags: tags.map((tag) => tag.name) };
}

export async function getItemStats(userId: string): Promise<ItemStats> {
  const [totalItems, favoriteItems] = await Promise.all([
    prisma.item.count({ where: { userId } }),
    prisma.item.count({ where: { userId, isFavorite: true } }),
  ]);

  return { totalItems, favoriteItems };
}

// System types with the number of the user's items of each, in spec display order.
export async function getSystemItemTypes(userId: string): Promise<ItemTypeWithCount[]> {
  const types = await prisma.itemType.findMany({
    where: { isSystem: true },
    select: {
      id: true,
      name: true,
      _count: { select: { items: { where: { userId } } } },
    },
  });

  return types
    .map(({ _count, ...type }) => ({ ...type, itemCount: _count.items }))
    .sort((a, b) => typeOrder(a.name) - typeOrder(b.name));
}

// Unknown names sort last.
function typeOrder(name: string): number {
  const index = SYSTEM_ITEM_TYPE_ORDER.indexOf(name);
  return index === -1 ? SYSTEM_ITEM_TYPE_ORDER.length : index;
}

export async function getPinnedItems(
  userId: string,
  limit: number
): Promise<ItemWithType[]> {
  const items = await prisma.item.findMany({
    where: { userId, isPinned: true },
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: ITEM_CARD_SELECT,
  });

  return items.map(toItemWithType);
}

// All of the user's items of one system type, pinned first, then most recently updated.
export async function getItemsByType(
  userId: string,
  typeName: string
): Promise<ItemWithType[]> {
  const items = await prisma.item.findMany({
    where: { userId, itemType: { name: typeName, isSystem: true } },
    orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
    select: ITEM_CARD_SELECT,
  });

  return items.map(toItemWithType);
}

const ITEM_DETAIL_SELECT = {
  id: true,
  title: true,
  description: true,
  contentType: true,
  content: true,
  url: true,
  fileUrl: true,
  fileName: true,
  fileSize: true,
  language: true,
  isFavorite: true,
  isPinned: true,
  createdAt: true,
  updatedAt: true,
  itemType: { select: { id: true, name: true } },
  tags: { select: { name: true }, orderBy: { name: "asc" } },
  collections: {
    select: { collection: { select: { id: true, name: true } } },
    orderBy: { collection: { name: "asc" } },
  },
} satisfies Prisma.ItemSelect;

// One item with everything the drawer shows, or null when the user has no item with that id.
export async function getItemDetail(
  userId: string,
  itemId: string
): Promise<ItemDetail | null> {
  const item = await prisma.item.findFirst({
    where: { id: itemId, userId },
    select: ITEM_DETAIL_SELECT,
  });

  if (!item) {
    return null;
  }

  const { tags, collections, ...detail } = item;
  return {
    ...detail,
    tags: tags.map((tag) => tag.name),
    collections: collections.map(({ collection }) => collection),
  };
}

export async function getRecentItems(
  userId: string,
  limit: number
): Promise<ItemWithType[]> {
  const items = await prisma.item.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: ITEM_CARD_SELECT,
  });

  return items.map(toItemWithType);
}
