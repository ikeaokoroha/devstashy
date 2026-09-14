import type { Item, ItemType } from "@/lib/mock-data";

export interface ItemStats {
  totalItems: number;
  favoriteItems: number;
}

export interface CollectionStats {
  totalCollections: number;
  favoriteCollections: number;
}

export type DashboardStats = ItemStats & CollectionStats;

export interface CollectionItemType {
  id: string;
  name: string;
}

export interface CollectionSummary {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
  itemCount: number;
  // Types present in the collection, most common first — the first one is the dominant type.
  itemTypes: CollectionItemType[];
}

export interface ItemWithType extends Item {
  itemType: ItemType;
}
