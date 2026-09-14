// Mock-backed item queries. Replace with Prisma queries once items are wired to the database.

import { items, itemTypes, type Item, type ItemType } from "@/lib/mock-data";
import type { ItemStats, ItemWithType } from "@/types/dashboard";

const itemTypesById = new Map(itemTypes.map((type) => [type.id, type]));

function getItemType(id: string): ItemType {
  const itemType = itemTypesById.get(id);
  if (!itemType) throw new Error(`Unknown item type: ${id}`);
  return itemType;
}

function byMostRecent(a: { updatedAt: Date }, b: { updatedAt: Date }) {
  return b.updatedAt.getTime() - a.updatedAt.getTime();
}

function withItemType(item: Item): ItemWithType {
  return { ...item, itemType: getItemType(item.itemTypeId) };
}

export function getItemStats(): ItemStats {
  return {
    totalItems: items.length,
    favoriteItems: items.filter((item) => item.isFavorite).length,
  };
}

export function getPinnedItems(): ItemWithType[] {
  return items
    .filter((item) => item.isPinned)
    .sort(byMostRecent)
    .map(withItemType);
}

export function getRecentItems(limit: number): ItemWithType[] {
  return [...items].sort(byMostRecent).slice(0, limit).map(withItemType);
}
