import type { SearchCollection, SearchData, SearchItem } from "@/types/search";

// How much of an item's content the palette carries and shows under its title.
export const SEARCH_PREVIEW_LENGTH = 120;

// Results shown per group. The palette scrolls, but a page of results is no
// longer scannable than the top few.
export const SEARCH_ITEM_LIMIT = 8;
export const SEARCH_COLLECTION_LIMIT = 5;

// The character before a new "word": "hook" should match use-hook.ts and
// useHook, and a camel hump counts too (handled in isWordStart).
const WORD_SEPARATOR = /[\s\-_/.:,()[\]{}]/;

// A content preview is a paragraph of prose or code, where a one- or two-
// character run appears in nearly everything. Below this, only titles,
// type names and collection names are searched.
const MIN_PREVIEW_QUERY_LENGTH = 3;

const PREFIX_BONUS = 15;
const WORD_START_BONUS = 10;
const CONSECUTIVE_BONUS = 8;
const GAP_PENALTY = 1;
// A long run of unmatched characters shouldn't sink a result past the point
// where the distance stops meaning anything.
const MAX_GAP_PENALTY = 6;

// Which field matched matters more than how well it matched, so every title
// match outranks every match found only in the content preview.
const TITLE_BONUS = 100;
const TYPE_BONUS = 40;
const PREVIEW_BONUS = 0;

// One line of an item's content for the palette: whitespace collapsed so a
// code snippet's indentation doesn't render as a blank row, then truncated.
export function toSearchPreview(content: string | null): string | null {
  const collapsed = content?.replace(/\s+/g, " ").trim();
  if (!collapsed) {
    return null;
  }

  return collapsed.length > SEARCH_PREVIEW_LENGTH
    ? `${collapsed.slice(0, SEARCH_PREVIEW_LENGTH).trimEnd()}…`
    : collapsed;
}

// Where a word starts: the first character, one after a separator, or a camel
// hump like the H in useAuthHook.
function isWordStart(text: string, index: number): boolean {
  if (index === 0) {
    return true;
  }

  const previous = text[index - 1];
  return (
    WORD_SEPARATOR.test(previous) ||
    (text[index] !== previous && previous === previous.toLowerCase() && /[A-Z]/.test(text[index]))
  );
}

// Scores a fuzzy match, or null when the text doesn't match.
//
// Every matched character has to either continue the previous one or start a
// word, so "auth" matches useAuthHook and "ah" matches it as an acronym, but a
// query is never scattered across a string just because its letters appear in
// order — a plain subsequence match puts almost every item behind a short query
// like "test". Whitespace in the query is ignored, so "react hook" still
// matches useReactHook.
export function fuzzyScore(text: string, query: string): number | null {
  const needle = Array.from(query.toLowerCase().replace(/\s+/g, ""));
  if (needle.length === 0) {
    return 0;
  }

  const haystack = text.toLowerCase();
  let best: number | null = null;

  // Every word the query could start at is tried, and the best match wins: a
  // run starting at one word often fails where a later one succeeds, as "test"
  // does against "the test suite" by way of "the".
  for (
    let start = haystack.indexOf(needle[0]);
    start !== -1;
    start = haystack.indexOf(needle[0], start + 1)
  ) {
    if (!isWordStart(text, start)) {
      continue;
    }
    const score = scoreFrom(text, haystack, needle, start);
    if (score !== null && (best === null || score > best)) {
      best = score;
    }
  }

  return best;
}

// Scores the rest of the query from a start the first character already matched,
// or null when it can't be carried through.
function scoreFrom(
  text: string,
  haystack: string,
  needle: string[],
  start: number
): number | null {
  let score = start === 0 ? PREFIX_BONUS : WORD_START_BONUS;
  let previous = start;

  for (const char of needle.slice(1)) {
    const index = findMatch(text, haystack, char, previous);
    if (index === null) {
      return null;
    }

    if (index === previous + 1) {
      score += CONSECUTIVE_BONUS;
    } else {
      // findMatch allows nothing but a continuation or a word start.
      score +=
        WORD_START_BONUS - Math.min(index - previous - 1, MAX_GAP_PENALTY) * GAP_PENALTY;
    }

    previous = index;
  }

  return score;
}

// The next place this character may match after the one before it: either
// straight after it, or the start of a later word. Occurrences that are neither
// are skipped rather than failing the match, so "hook" finds the Hook in
// useAuthHook and not the h in Auth before it.
function findMatch(
  text: string,
  haystack: string,
  char: string,
  previous: number
): number | null {
  if (haystack[previous + 1] === char) {
    return previous + 1;
  }

  let index = haystack.indexOf(char, previous + 1);
  while (index !== -1) {
    if (isWordStart(text, index)) {
      return index;
    }
    index = haystack.indexOf(char, index + 1);
  }

  return null;
}

// Scores a match inside an item's content preview, or null when the text
// doesn't contain the query. Prose gets substring matching rather than the
// fuzzy pass a title gets: nobody types an acronym expecting it to hit the
// middle of a paragraph, and letting them would match nearly every item.
export function contentScore(text: string, query: string): number | null {
  const needle = query.toLowerCase().trim();
  if (needle.length < MIN_PREVIEW_QUERY_LENGTH) {
    return null;
  }

  const index = text.toLowerCase().indexOf(needle);
  if (index === -1) {
    return null;
  }

  if (index === 0) {
    return PREFIX_BONUS;
  }
  return isWordStart(text, index) ? WORD_START_BONUS : 0;
}

type FieldMatcher = (text: string, query: string) => number | null;

interface SearchField {
  text: string | null;
  bonus: number;
  match?: FieldMatcher;
}

// The best score across a record's fields, or null when none of them match.
function bestFieldScore(fields: SearchField[], query: string): number | null {
  let best: number | null = null;

  for (const { text, bonus, match = fuzzyScore } of fields) {
    if (!text) {
      continue;
    }
    const score = match(text, query);
    if (score === null) {
      continue;
    }
    const total = score + bonus;
    if (best === null || total > best) {
      best = total;
    }
  }

  return best;
}

// Ranks matches highest first, breaking ties on the label so the order is stable.
function rank<T>(
  records: T[],
  query: string,
  limit: number,
  fields: (record: T) => SearchField[],
  label: (record: T) => string
): T[] {
  // An empty query keeps the order the records arrived in — most recent first
  // for items, favorites first for collections — so opening the palette shows
  // something useful before anything is typed.
  if (query.trim() === "") {
    return records.slice(0, limit);
  }

  return records
    .map((record) => ({ record, score: bestFieldScore(fields(record), query) }))
    .filter((scored): scored is { record: T; score: number } => scored.score !== null)
    .sort((a, b) => b.score - a.score || label(a.record).localeCompare(label(b.record)))
    .slice(0, limit)
    .map(({ record }) => record);
}

export function searchItems(
  items: SearchItem[],
  query: string,
  limit = SEARCH_ITEM_LIMIT
): SearchItem[] {
  return rank(
    items,
    query,
    limit,
    (item) => [
      { text: item.title, bonus: TITLE_BONUS },
      { text: item.itemType.name, bonus: TYPE_BONUS },
      { text: item.preview, bonus: PREVIEW_BONUS, match: contentScore },
    ],
    (item) => item.title
  );
}

export function searchCollections(
  collections: SearchCollection[],
  query: string,
  limit = SEARCH_COLLECTION_LIMIT
): SearchCollection[] {
  return rank(
    collections,
    query,
    limit,
    (collection) => [{ text: collection.name, bonus: TITLE_BONUS }],
    (collection) => collection.name
  );
}

export function searchAll(data: SearchData, query: string): SearchData {
  return {
    items: searchItems(data.items, query),
    collections: searchCollections(data.collections, query),
  };
}
