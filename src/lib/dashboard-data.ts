// Mock-backed dashboard queries. Replace with Prisma queries once the database is in place.

import {
  collections,
  items,
  itemTypes,
  type Collection,
  type Item,
  type ItemType,
} from "@/lib/mock-data";
import type {
  CollectionSummary,
  DashboardStats,
  ItemWithType,
} from "@/types/dashboard";

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

function summarizeCollection(collection: Collection): CollectionSummary {
  const collectionItems = items.filter((item) =>
    item.collectionIds.includes(collection.id)
  );

  const typeCounts = new Map<string, number>();
  for (const item of collectionItems) {
    typeCounts.set(item.itemTypeId, (typeCounts.get(item.itemTypeId) ?? 0) + 1);
  }

  const types = [...typeCounts.entries()]
    .sort(([, a], [, b]) => b - a)
    .map(([typeId]) => getItemType(typeId));

  return { ...collection, itemCount: collectionItems.length, itemTypes: types };
}

export function getDashboardStats(): DashboardStats {
  return {
    totalItems: items.length,
    totalCollections: collections.length,
    favoriteItems: items.filter((item) => item.isFavorite).length,
    favoriteCollections: collections.filter((c) => c.isFavorite).length,
  };
}

export function getRecentCollections(limit: number): CollectionSummary[] {
  return [...collections]
    .sort(byMostRecent)
    .slice(0, limit)
    .map(summarizeCollection);
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
