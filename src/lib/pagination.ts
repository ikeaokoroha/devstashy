// Page sizes for the paginated list pages, and the fixed limits the dashboard's
// preview sections use instead.
export const ITEMS_PER_PAGE = 21;
export const COLLECTIONS_PER_PAGE = 21;
export const DASHBOARD_COLLECTIONS_LIMIT = 6;
export const DASHBOARD_RECENT_ITEMS_LIMIT = 10;

// An upper bound on ?page= so a URL full of digits can't reach the query as a
// skip Postgres has to reason about. A page this high is out of range for any
// real list, so it 404s the way any other too-high page does.
const MAX_PAGE = 1_000_000;

// Links either side of the current page before the row collapses into ellipses.
const PAGE_WINDOW = 1;

// First, last, the window around the current page and the two ellipses. Below
// this many pages every number fits, so none are hidden.
const MAX_PAGE_LINKS = 2 * PAGE_WINDOW + 5;

export type PageLink = number | "ellipsis";

// A page from the ?page= search param. Anything that isn't a plain positive
// integer — junk, a negative, a zero, or the array Next hands back for a
// repeated param — falls back to the first page.
export function parsePageParam(value: string | string[] | undefined): number {
  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    return 1;
  }

  const page = Number(value);
  if (page < 1) {
    return 1;
  }

  return Math.min(page, MAX_PAGE);
}

// 0 for an empty list, so the controls stay hidden rather than showing a lone
// page 1 under an empty state.
export function getPageCount(total: number, perPage: number): number {
  if (total <= 0) {
    return 0;
  }

  return Math.ceil(total / perPage);
}

export function getPageSkip(page: number, perPage: number): number {
  return (page - 1) * perPage;
}

// Page 1 links back to the bare path rather than ?page=1, so the first page has
// one canonical URL however you arrive at it.
export function getPageHref(basePath: string, page: number): string {
  return page <= 1 ? basePath : `${basePath}?page=${page}`;
}

// A bad page number is a bad URL, so the page 404s rather than clamping, which
// would hide the typo. Page 1 is always in range: an empty list still renders
// its normal empty state.
export function isPageOutOfRange(page: number, pageCount: number): boolean {
  return page > 1 && page > pageCount;
}

// The numbered links to render: always the first and last page, a window around
// the current one, and an ellipsis wherever that skips a run.
export function getPageNumbers(current: number, pageCount: number): PageLink[] {
  if (pageCount <= 0) {
    return [];
  }

  if (pageCount <= MAX_PAGE_LINKS) {
    return range(1, pageCount);
  }

  const page = Math.min(Math.max(current, 1), pageCount);

  // The window widens against whichever end it runs into, so the row holds a
  // steady width instead of shrinking on the first and last pages, where one of
  // the ellipses drops out.
  const edgeSpan = 2 * PAGE_WINDOW + 3;
  const start = Math.max(2, Math.min(page - PAGE_WINDOW, pageCount - edgeSpan + 1));
  const end = Math.min(pageCount - 1, Math.max(page + PAGE_WINDOW, edgeSpan));

  return [
    1,
    ...(start > 2 ? (["ellipsis"] as const) : []),
    ...range(start, end),
    ...(end < pageCount - 1 ? (["ellipsis"] as const) : []),
    pageCount,
  ];
}

function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}
