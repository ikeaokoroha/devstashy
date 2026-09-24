import type { ItemPreview } from "@/types/dashboard";

// One item in the command palette. It extends the drawer's preview shape, so
// selecting a result can open the drawer without a card's worth of data.
export interface SearchItem extends ItemPreview {
  // The first line or so of the item's content, shown under the title and
  // searched alongside it.
  preview: string | null;
}

export interface SearchCollection {
  id: string;
  name: string;
  itemCount: number;
}

// Everything the palette searches, fetched once when the shell mounts.
export interface SearchData {
  items: SearchItem[];
  collections: SearchCollection[];
}

// A refresh that fails while data is already loaded keeps that data, so only
// the first fetch can leave the palette with nothing to show.
export type SearchDataState =
  | { status: "loading" }
  | { status: "loaded"; data: SearchData }
  | { status: "error"; error: string };
