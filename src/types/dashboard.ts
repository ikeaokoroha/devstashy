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

export interface ItemTypeWithCount {
  id: string;
  name: string;
  itemCount: number;
}

export interface SidebarCollection {
  id: string;
  name: string;
  isFavorite: boolean;
  // Most-used item type in the collection; null when it has no items.
  dominantType: CollectionItemType | null;
}

export interface SidebarCollections {
  favorites: SidebarCollection[];
  recent: SidebarCollection[];
}

export interface ItemWithType {
  id: string;
  title: string;
  description: string | null;
  isFavorite: boolean;
  isPinned: boolean;
  updatedAt: Date;
  // Null for every type but file and image; the gallery's thumbnails read them.
  fileUrl: string | null;
  fileName: string | null;
  tags: string[];
  itemType: CollectionItemType;
}

export interface SidebarUserInfo {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}
