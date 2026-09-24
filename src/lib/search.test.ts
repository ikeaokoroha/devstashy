import { describe, expect, it } from "vitest";

import {
  contentScore,
  fuzzyScore,
  searchAll,
  searchCollections,
  searchItems,
  toSearchPreview,
  SEARCH_COLLECTION_LIMIT,
  SEARCH_ITEM_LIMIT,
  SEARCH_PREVIEW_LENGTH,
} from "@/lib/search";
import type { SearchCollection, SearchItem } from "@/types/search";

function item(
  id: string,
  title: string,
  typeName = "snippet",
  preview: string | null = null
): SearchItem {
  return {
    id,
    title,
    isFavorite: false,
    isPinned: false,
    itemType: { id: `type-${typeName}`, name: typeName },
    preview,
  };
}

function collection(id: string, name: string, itemCount = 0): SearchCollection {
  return { id, name, itemCount };
}

describe("toSearchPreview", () => {
  it("returns null for empty and whitespace-only content", () => {
    expect(toSearchPreview(null)).toBeNull();
    expect(toSearchPreview("")).toBeNull();
    expect(toSearchPreview("  \n\t ")).toBeNull();
  });

  it("collapses whitespace so an indented snippet reads as one line", () => {
    expect(toSearchPreview("const a = 1;\n\n    return a;")).toBe("const a = 1; return a;");
  });

  it("truncates long content with an ellipsis", () => {
    const preview = toSearchPreview("a".repeat(SEARCH_PREVIEW_LENGTH + 50));

    expect(preview).toBe(`${"a".repeat(SEARCH_PREVIEW_LENGTH)}…`);
  });

  it("leaves content at the limit untouched", () => {
    const content = "a".repeat(SEARCH_PREVIEW_LENGTH);

    expect(toSearchPreview(content)).toBe(content);
  });

  it("doesn't leave a dangling space when the cut lands on one", () => {
    const preview = toSearchPreview(`${"a".repeat(SEARCH_PREVIEW_LENGTH - 1)} word`);

    expect(preview).toBe(`${"a".repeat(SEARCH_PREVIEW_LENGTH - 1)}…`);
  });
});

describe("fuzzyScore", () => {
  it("returns null when the query isn't a subsequence", () => {
    expect(fuzzyScore("React Hook", "redux")).toBeNull();
    // In order only: the characters are all there, but not in this sequence.
    expect(fuzzyScore("React Hook", "kooh")).toBeNull();
  });

  it("matches case-insensitively and ignores whitespace in the query", () => {
    expect(fuzzyScore("useReactHook", "react hook")).not.toBeNull();
    expect(fuzzyScore("Debounce Hook", "DEBOUNCE")).not.toBeNull();
  });

  it("scores a prefix match above a match later in the text", () => {
    const prefix = fuzzyScore("hooks guide", "hook");
    const later = fuzzyScore("the guide to hooks", "hook");

    expect(prefix).toBeGreaterThan(later!);
  });

  it("won't scatter a query across a string whose letters merely appear in order", () => {
    // The bug this rule exists for: a plain subsequence match put almost every
    // item behind a short query.
    expect(fuzzyScore("TypeScript Setup", "test")).toBeNull();
    expect(fuzzyScore("Fetch with retries", "test")).toBeNull();
  });

  it("matches a run that starts mid-word only from the word it starts", () => {
    // The h of Auth can't start the match; the H of Hook can.
    expect(fuzzyScore("useAuthHook", "hook")).not.toBeNull();
    expect(fuzzyScore("thehookhelper", "hook")).toBeNull();
  });

  it("retries from a later word when an earlier one is a dead end", () => {
    // The t of "the" starts a run that can't be carried through; the match is
    // the word "test" after it.
    expect(fuzzyScore("Run the test suite", "test")).not.toBeNull();
    expect(fuzzyScore("the theme test", "test")).not.toBeNull();
  });

  it("matches an acronym across word starts, camel humps included", () => {
    expect(fuzzyScore("useAuthHook", "uah")).not.toBeNull();
    expect(fuzzyScore("get-user-token", "gut")).not.toBeNull();
  });

  it("scores a consecutive run above the same letters hopping between words", () => {
    const consecutive = fuzzyScore("auth helper", "auth");
    const acronym = fuzzyScore("a user token handler", "auth");

    expect(consecutive).toBeGreaterThan(acronym!);
  });

  it("scores an empty query as a match on everything", () => {
    expect(fuzzyScore("anything", "")).toBe(0);
    expect(fuzzyScore("anything", "   ")).toBe(0);
  });
});

describe("contentScore", () => {
  it("matches a substring, not a subsequence", () => {
    expect(contentScore("export function useDebounce()", "debounce")).not.toBeNull();
    expect(contentScore("export function useDebounce()", "expfn")).toBeNull();
  });

  it("ignores queries too short to mean anything in a paragraph", () => {
    expect(contentScore("a test of the emergency system", "te")).toBeNull();
    expect(contentScore("a test of the emergency system", "tes")).not.toBeNull();
  });

  it("scores a match at the start above one at a word start above one mid-word", () => {
    const start = contentScore("test the thing", "test");
    const wordStart = contentScore("run the test now", "test");
    const midWord = contentScore("run the latest now", "test");

    expect(start).toBeGreaterThan(wordStart!);
    expect(wordStart).toBeGreaterThan(midWord!);
  });

  it("matches case-insensitively", () => {
    expect(contentScore("Run The Tests", "run the tests")).not.toBeNull();
  });
});

describe("searchItems", () => {
  it("keeps the given order and caps the list when the query is empty", () => {
    const items = [item("1", "Newest"), item("2", "Older"), item("3", "Oldest")];

    expect(searchItems(items, "  ", 2)).toEqual([items[0], items[1]]);
  });

  it("drops items nothing in them matches", () => {
    const items = [item("1", "React Hook"), item("2", "Python Script")];

    expect(searchItems(items, "hook").map(({ id }) => id)).toEqual(["1"]);
  });

  it("ranks a title match above a type match above a preview-only match", () => {
    const items = [
      item("preview", "Unrelated", "note", "a note about prompts"),
      item("type", "Unrelated too", "prompt"),
      item("title", "Prompt library", "note"),
    ];

    expect(searchItems(items, "prompt").map(({ id }) => id)).toEqual([
      "title",
      "type",
      "preview",
    ]);
  });

  it("matches on the content preview", () => {
    const items = [item("1", "Untitled", "snippet", "export function useDebounce()")];

    expect(searchItems(items, "debounce").map(({ id }) => id)).toEqual(["1"]);
  });

  it("leaves items a short query only happens to appear inside alone", () => {
    const items = [
      item("1", "TypeScript Setup", "snippet", "npm install --save-dev typescript"),
      item("2", "Run the test suite", "command", "npm run test:run"),
    ];

    expect(searchItems(items, "test").map(({ id }) => id)).toEqual(["2"]);
  });

  it("breaks score ties on the title, so the order is stable", () => {
    const items = [item("1", "Hook B"), item("2", "Hook A")];

    expect(searchItems(items, "hook").map(({ title }) => title)).toEqual(["Hook A", "Hook B"]);
  });

  it("caps the results at the limit", () => {
    const items = Array.from({ length: 20 }, (_, index) => item(`${index}`, `Hook ${index}`));

    expect(searchItems(items, "hook", 5)).toHaveLength(5);
  });
});

describe("searchCollections", () => {
  it("keeps the given order when the query is empty", () => {
    const collections = [collection("1", "Favorite"), collection("2", "Recent")];

    expect(searchCollections(collections, "")).toEqual(collections);
  });

  it("matches on the name and drops the rest", () => {
    const collections = [collection("1", "React Patterns"), collection("2", "Python")];

    expect(searchCollections(collections, "react").map(({ id }) => id)).toEqual(["1"]);
  });

  it("caps the results at the limit", () => {
    const collections = Array.from({ length: 12 }, (_, index) =>
      collection(`${index}`, `Patterns ${index}`)
    );

    expect(searchCollections(collections, "patterns", 3)).toHaveLength(3);
  });
});

describe("searchAll", () => {
  // The palette calls searchAll, so these defaults are the caps the results
  // list actually runs under.
  it("caps each group at its default limit", () => {
    const data = {
      items: Array.from({ length: 20 }, (_, index) => item(`${index}`, `Hook ${index}`)),
      collections: Array.from({ length: 12 }, (_, index) =>
        collection(`c${index}`, `Hooks ${index}`)
      ),
    };

    const results = searchAll(data, "hook");

    expect(results.items).toHaveLength(SEARCH_ITEM_LIMIT);
    expect(results.collections).toHaveLength(SEARCH_COLLECTION_LIMIT);
  });

  it("caps an empty query the same way, so the palette opens on a short list", () => {
    const data = {
      items: Array.from({ length: 20 }, (_, index) => item(`${index}`, `Item ${index}`)),
      collections: Array.from({ length: 12 }, (_, index) =>
        collection(`c${index}`, `Collection ${index}`)
      ),
    };

    const results = searchAll(data, "");

    expect(results.items).toHaveLength(SEARCH_ITEM_LIMIT);
    expect(results.collections).toHaveLength(SEARCH_COLLECTION_LIMIT);
  });

  it("searches both groups with the one query", () => {
    const data = {
      items: [item("1", "React Hook"), item("2", "Python Script")],
      collections: [collection("c1", "React Patterns"), collection("c2", "Shell")],
    };

    expect(searchAll(data, "react")).toEqual({
      items: [data.items[0]],
      collections: [data.collections[0]],
    });
  });

  it("returns empty groups when nothing matches", () => {
    const data = {
      items: [item("1", "React Hook")],
      collections: [collection("c1", "React Patterns")],
    };

    expect(searchAll(data, "zzz")).toEqual({ items: [], collections: [] });
  });
});
