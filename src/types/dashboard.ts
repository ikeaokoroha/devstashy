import type { Collection, Item, ItemType } from "@/lib/mock-data";

export interface DashboardStats {
  totalItems: number;
  totalCollections: number;
  favoriteItems: number;
  favoriteCollections: number;
}

export interface CollectionSummary extends Collection {
  itemCount: number;
  // Types present in the collection, most common first — the first one is the dominant type.
  itemTypes: ItemType[];
}

export interface ItemWithType extends Item {
  itemType: ItemType;
}
