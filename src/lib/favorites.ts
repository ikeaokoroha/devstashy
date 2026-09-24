import type { FavoriteCollection, FavoriteItem } from "@/types/dashboard";

export type FavoriteSort = "date" | "name" | "type";

// The select reads its options from here, so adding a key is one edit. The
// labels say what the sort does rather than which field it reads: "Newest"
// because date is descending, and "Title" because that's the item field (a
// collection has only a name, and sorts by it).
export const FAVORITE_SORT_OPTIONS: { value: FavoriteSort; label: string }[] = [
  { value: "date", label: "Newest" },
  { value: "name", label: "Title" },
  { value: "type", label: "Item type" },
];

// Both queries already come back sorted by updatedAt desc, so this default
// leaves the first paint exactly as it was before sorting existed.
export const DEFAULT_FAVORITE_SORT: FavoriteSort = "date";

// Sorting runs in the browser, but the list still server-renders for the initial
// HTML, so the comparator runs once in Node and again in the client. A plain
// comparison on the lowercased string is the only one guaranteed to agree in
// both, where localeCompare's ordering can differ between ICU builds.
function compareText(a: string, b: string): number {
  const left = a.toLowerCase();
  const right = b.toLowerCase();
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

// The favorites list is a dense mono column, so dates are rendered ISO-style:
// fixed width, so the column lines up, and unambiguous, unlike a localized
// short date. Taken from the ISO string rather than Intl so it stays in UTC and
// doesn't depend on the server's time zone, matching the other date helpers.
export function formatFavoriteDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// Name and type read ascending; date reads newest first, which is the order the
// page has always opened in. Name is the tie-break throughout, since a type and
// a date both repeat across rows and an unstable order would shuffle on a
// re-render.
export function sortFavoriteItems(items: FavoriteItem[], sort: FavoriteSort): FavoriteItem[] {
  // Copied first: the array is a prop, and sort() would reorder it in place.
  return [...items].sort((a, b) => {
    if (sort === "date") {
      const byDate = b.updatedAt.getTime() - a.updatedAt.getTime();
      if (byDate !== 0) return byDate;
    }

    if (sort === "type") {
      const byType = compareText(a.itemType.name, b.itemType.name);
      if (byType !== 0) return byType;
    }

    return compareText(a.title, b.title);
  });
}

// A collection has no item type, so it falls back to name under that key rather
// than sitting still while the items above it reorder.
export function sortFavoriteCollections(
  collections: FavoriteCollection[],
  sort: FavoriteSort,
): FavoriteCollection[] {
  return [...collections].sort((a, b) => {
    if (sort === "date") {
      const byDate = b.updatedAt.getTime() - a.updatedAt.getTime();
      if (byDate !== 0) return byDate;
    }

    return compareText(a.name, b.name);
  });
}
