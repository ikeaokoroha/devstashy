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

// One collection's own row, for the /collections/[id] header. Its items come
// from getItemsByCollection rather than being nested here.
export interface CollectionDetail {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
  createdAt: Date;
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
  // What the card's copy button puts on the clipboard, by type: content for the
  // text types, url for a link, fileUrl for file and image.
  content: string | null;
  url: string | null;
  // Null for every type but file and image; the gallery's thumbnails and the
  // file list's rows read them.
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  tags: string[];
  itemType: CollectionItemType;
}

// What the item drawer needs to render its header and action bar before the
// full item loads. A card (ItemWithType) and a search result both satisfy it.
export type ItemPreview = Pick<
  ItemWithType,
  "id" | "title" | "isFavorite" | "isPinned" | "itemType"
>;

// One row on the favorites list. A preview is all the row renders besides the
// date, and it's also what the drawer needs, so the query stays off the card
// select's content, url and file columns.
export type FavoriteItem = ItemPreview & { updatedAt: Date };

// One collection row on the favorites list. No itemTypes: the rows show a
// folder rather than a dominant-type colour, so none of the join rows are read.
export interface FavoriteCollection {
  id: string;
  name: string;
  itemCount: number;
  updatedAt: Date;
}

export interface SidebarUserInfo {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}
