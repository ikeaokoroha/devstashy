// The favorites list is a dense mono column, so dates are rendered ISO-style:
// fixed width, so the column lines up, and unambiguous, unlike a localized
// short date. Taken from the ISO string rather than Intl so it stays in UTC and
// doesn't depend on the server's time zone, matching the other date helpers.
export function formatFavoriteDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
