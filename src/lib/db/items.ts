import type { Prisma } from "@/generated/prisma/client";
import { SYSTEM_ITEM_TYPE_ORDER } from "@/lib/item-types";
import { prisma } from "@/lib/prisma";
import type { ItemStats, ItemTypeWithCount, ItemWithType } from "@/types/dashboard";

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
