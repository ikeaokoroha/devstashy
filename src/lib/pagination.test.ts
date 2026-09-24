import { describe, expect, it } from "vitest";

import {
  getPageCount,
  getPageHref,
  getPageNumbers,
  getPageSkip,
  isPageOutOfRange,
  parsePageParam,
  ITEMS_PER_PAGE,
} from "@/lib/pagination";

describe("parsePageParam", () => {
  it("reads a plain page number", () => {
    expect(parsePageParam("3")).toBe(3);
  });

  it("falls back to the first page for junk, zero and negatives", () => {
    expect(parsePageParam(undefined)).toBe(1);
    expect(parsePageParam("")).toBe(1);
    expect(parsePageParam("abc")).toBe(1);
    expect(parsePageParam("1.5")).toBe(1);
    expect(parsePageParam("0")).toBe(1);
    expect(parsePageParam("-2")).toBe(1);
  });

  it("falls back to the first page for a repeated param", () => {
    expect(parsePageParam(["2", "3"])).toBe(1);
  });

  // A page this high is out of range for any real list, so it 404s rather than
  // reaching the query as an enormous skip.
  it("caps an absurd page number", () => {
    const page = parsePageParam("99999999999999999999");
    expect(Number.isSafeInteger(page)).toBe(true);
    expect(page).toBe(1_000_000);
  });
});

describe("getPageCount", () => {
  it("rounds a partial last page up", () => {
    expect(getPageCount(22, ITEMS_PER_PAGE)).toBe(2);
    expect(getPageCount(42, ITEMS_PER_PAGE)).toBe(2);
    expect(getPageCount(43, ITEMS_PER_PAGE)).toBe(3);
  });

  it("is zero for an empty list, so the controls stay hidden", () => {
    expect(getPageCount(0, ITEMS_PER_PAGE)).toBe(0);
  });
});

describe("getPageSkip", () => {
  it("skips nothing on the first page", () => {
    expect(getPageSkip(1, ITEMS_PER_PAGE)).toBe(0);
  });

  it("skips a whole page per page before the current one", () => {
    expect(getPageSkip(3, ITEMS_PER_PAGE)).toBe(42);
  });
});

describe("getPageHref", () => {
  it("leaves the first page on the bare path", () => {
    expect(getPageHref("/items/snippets", 1)).toBe("/items/snippets");
  });

  it("puts every other page in the query string", () => {
    expect(getPageHref("/items/snippets", 2)).toBe("/items/snippets?page=2");
  });
});

describe("isPageOutOfRange", () => {
  it("accepts a page within the list", () => {
    expect(isPageOutOfRange(1, 3)).toBe(false);
    expect(isPageOutOfRange(3, 3)).toBe(false);
  });

  it("rejects a page past the last one", () => {
    expect(isPageOutOfRange(4, 3)).toBe(true);
  });

  it("keeps page 1 of an empty list in range", () => {
    expect(isPageOutOfRange(1, 0)).toBe(false);
    expect(isPageOutOfRange(2, 0)).toBe(true);
  });
});

describe("getPageNumbers", () => {
  it("renders nothing for an empty list", () => {
    expect(getPageNumbers(1, 0)).toEqual([]);
  });

  it("lists every page while they all fit", () => {
    expect(getPageNumbers(1, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("ellipsizes the tail near the start", () => {
    expect(getPageNumbers(1, 10)).toEqual([1, 2, 3, 4, 5, "ellipsis", 10]);
    expect(getPageNumbers(3, 10)).toEqual([1, 2, 3, 4, 5, "ellipsis", 10]);
  });

  it("ellipsizes both sides in the middle", () => {
    expect(getPageNumbers(5, 10)).toEqual([1, "ellipsis", 4, 5, 6, "ellipsis", 10]);
  });

  it("ellipsizes the head near the end", () => {
    expect(getPageNumbers(10, 10)).toEqual([1, "ellipsis", 6, 7, 8, 9, 10]);
  });

  // The window widens against whichever end it hits, so the row doesn't shrink
  // and grow as you page through a long list.
  it("keeps a steady width across a long list", () => {
    for (let page = 1; page <= 20; page++) {
      expect(getPageNumbers(page, 20)).toHaveLength(7);
    }
  });

  it("clamps a current page outside the list", () => {
    expect(getPageNumbers(99, 10)).toEqual(getPageNumbers(10, 10));
    expect(getPageNumbers(0, 10)).toEqual(getPageNumbers(1, 10));
  });

  it("never repeats a page or drops the first and last", () => {
    for (let pageCount = 1; pageCount <= 30; pageCount++) {
      for (let page = 1; page <= pageCount; page++) {
        const numbers = getPageNumbers(page, pageCount).filter(
          (link): link is number => link !== "ellipsis"
        );

        expect(numbers[0]).toBe(1);
        expect(numbers.at(-1)).toBe(pageCount);
        expect(new Set(numbers).size).toBe(numbers.length);
        expect([...numbers].sort((a, b) => a - b)).toEqual(numbers);
        expect(numbers).toContain(page);
      }
    }
  });
});
