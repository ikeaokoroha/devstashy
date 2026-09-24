import { describe, expect, it } from "vitest";

import {
  DEFAULT_FAVORITE_SORT,
  FAVORITE_SORT_OPTIONS,
  formatFavoriteDate,
  sortFavoriteCollections,
  sortFavoriteItems,
} from "@/lib/favorites";
import type { FavoriteCollection, FavoriteItem } from "@/types/dashboard";

function makeItem(
  title: string,
  typeName: string,
  updatedAt: string,
  id = `${title}-${typeName}`,
): FavoriteItem {
  return {
    id,
    title,
    isFavorite: true,
    isPinned: false,
    itemType: { id: `type-${typeName}`, name: typeName },
    updatedAt: new Date(updatedAt),
  };
}

function makeCollection(name: string, updatedAt: string): FavoriteCollection {
  return { id: `id-${name}`, name, itemCount: 0, updatedAt: new Date(updatedAt) };
}

describe("formatFavoriteDate", () => {
  it("formats a date as fixed-width ISO", () => {
    expect(formatFavoriteDate(new Date("2026-02-01T09:30:00Z"))).toBe("2026-02-01");
  });

  // The column lines up in the mono list only if every date is the same width.
  it("zero-pads single-digit months and days", () => {
    expect(formatFavoriteDate(new Date("2026-03-07T00:00:00Z"))).toBe("2026-03-07");
  });

  // Formatting off the local date would roll this back a day west of UTC.
  it("stays in UTC rather than the server's time zone", () => {
    expect(formatFavoriteDate(new Date("2026-02-01T00:30:00Z"))).toBe("2026-02-01");
  });
});

describe("FAVORITE_SORT_OPTIONS", () => {
  // The select maps over these, so a duplicate value would render two items
  // that set the same sort.
  it("has no duplicate values", () => {
    const values = FAVORITE_SORT_OPTIONS.map((option) => option.value);
    expect(new Set(values).size).toBe(values.length);
  });

  it("includes the default sort", () => {
    expect(FAVORITE_SORT_OPTIONS.map((option) => option.value)).toContain(DEFAULT_FAVORITE_SORT);
  });
});

describe("sortFavoriteItems", () => {
  it("sorts by name ascending, ignoring case", () => {
    const items = [
      makeItem("useAuth", "Snippet", "2026-01-01T00:00:00Z"),
      makeItem("apiClient", "Snippet", "2026-01-02T00:00:00Z"),
      makeItem("Build steps", "Note", "2026-01-03T00:00:00Z"),
    ];

    expect(sortFavoriteItems(items, "name").map((item) => item.title)).toEqual([
      "apiClient",
      "Build steps",
      "useAuth",
    ]);
  });

  // Newest first, which is the order the queries already return.
  it("sorts by date descending", () => {
    const items = [
      makeItem("Older", "Note", "2026-01-01T00:00:00Z"),
      makeItem("Newest", "Note", "2026-03-01T00:00:00Z"),
      makeItem("Middle", "Note", "2026-02-01T00:00:00Z"),
    ];

    expect(sortFavoriteItems(items, "date").map((item) => item.title)).toEqual([
      "Newest",
      "Middle",
      "Older",
    ]);
  });

  it("sorts by item type ascending", () => {
    const items = [
      makeItem("A prompt", "Prompt", "2026-01-01T00:00:00Z"),
      makeItem("A command", "Command", "2026-01-01T00:00:00Z"),
      makeItem("A note", "Note", "2026-01-01T00:00:00Z"),
    ];

    expect(sortFavoriteItems(items, "type").map((item) => item.itemType.name)).toEqual([
      "Command",
      "Note",
      "Prompt",
    ]);
  });

  // A type repeats across rows, so without the fallback the order within a type
  // would be whatever the query happened to return.
  it("falls back to name within one item type", () => {
    const items = [
      makeItem("zeta", "Snippet", "2026-03-01T00:00:00Z"),
      makeItem("alpha", "Snippet", "2026-01-01T00:00:00Z"),
    ];

    expect(sortFavoriteItems(items, "type").map((item) => item.title)).toEqual(["alpha", "zeta"]);
  });

  it("falls back to name when two items share a date", () => {
    const items = [
      makeItem("zeta", "Note", "2026-01-01T00:00:00Z"),
      makeItem("alpha", "Snippet", "2026-01-01T00:00:00Z"),
    ];

    expect(sortFavoriteItems(items, "date").map((item) => item.title)).toEqual(["alpha", "zeta"]);
  });

  // The array is a prop on a client component; sorting it in place would
  // reorder what the server handed down.
  it("leaves the input array untouched", () => {
    const items = [
      makeItem("zeta", "Note", "2026-01-01T00:00:00Z"),
      makeItem("alpha", "Note", "2026-02-01T00:00:00Z"),
    ];

    sortFavoriteItems(items, "name");

    expect(items.map((item) => item.title)).toEqual(["zeta", "alpha"]);
  });
});

describe("sortFavoriteCollections", () => {
  it("sorts by name ascending, ignoring case", () => {
    const collections = [
      makeCollection("react patterns", "2026-01-01T00:00:00Z"),
      makeCollection("AI Workflows", "2026-01-02T00:00:00Z"),
    ];

    expect(sortFavoriteCollections(collections, "name").map((c) => c.name)).toEqual([
      "AI Workflows",
      "react patterns",
    ]);
  });

  it("sorts by date descending", () => {
    const collections = [
      makeCollection("Older", "2026-01-01T00:00:00Z"),
      makeCollection("Newer", "2026-02-01T00:00:00Z"),
    ];

    expect(sortFavoriteCollections(collections, "date").map((c) => c.name)).toEqual([
      "Newer",
      "Older",
    ]);
  });

  // A collection has no item type, so it sorts by name rather than sitting
  // still while the items above it reorder.
  it("falls back to name under the item type sort", () => {
    const collections = [
      makeCollection("Zebra", "2026-01-01T00:00:00Z"),
      makeCollection("Apple", "2026-02-01T00:00:00Z"),
    ];

    expect(sortFavoriteCollections(collections, "type").map((c) => c.name)).toEqual([
      "Apple",
      "Zebra",
    ]);
  });

  it("leaves the input array untouched", () => {
    const collections = [
      makeCollection("Zebra", "2026-01-01T00:00:00Z"),
      makeCollection("Apple", "2026-02-01T00:00:00Z"),
    ];

    sortFavoriteCollections(collections, "name");

    expect(collections.map((c) => c.name)).toEqual(["Zebra", "Apple"]);
  });
});
