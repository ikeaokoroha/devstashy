import type { ItemContentType } from "@/generated/prisma/enums";
import type { CollectionItemType } from "@/types/dashboard";

export interface ItemCollectionRef {
  id: string;
  name: string;
}

// Everything the item drawer shows, fetched on click from /api/items/[id].
export interface ItemDetail {
  id: string;
  title: string;
  description: string | null;
  contentType: ItemContentType;
  content: string | null;
  url: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  language: string | null;
  isFavorite: boolean;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
  itemType: CollectionItemType;
  tags: string[];
  collections: ItemCollectionRef[];
}

// ItemDetail as it arrives over JSON, with the dates as ISO strings.
export type ItemDetailJson = Omit<ItemDetail, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

// A file the browser has finished uploading to R2, ready for createItem to store.
export interface UploadedFile {
  fileUrl: string;
  fileName: string;
  fileSize: number;
}

// The drawer's fetch of the full item after a card is clicked.
export type ItemDetailState =
  | { status: "loading" }
  | { status: "loaded"; item: ItemDetailJson }
  | { status: "error"; error: string };
