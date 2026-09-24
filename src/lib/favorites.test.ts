import { describe, expect, it } from "vitest";

import { formatFavoriteDate } from "@/lib/favorites";

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
