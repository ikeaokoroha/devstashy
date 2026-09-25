"use client";

import { Search } from "lucide-react";

import { Kbd } from "@/components/ui/kbd";
import { useSearch } from "./SearchProvider";

// Looks like the top bar's old search input, but opens the palette instead of
// taking typing: one search box, one place the query lives.
export function SearchTrigger() {
  const { openSearch } = useSearch();

  return (
    <div className="relative w-full max-w-md">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <button
        type="button"
        onClick={openSearch}
        aria-label="Search items and collections"
        aria-keyshortcuts="Meta+K Control+K"
        className="h-9 w-full truncate rounded-lg border border-input bg-transparent py-1 pr-3 pl-9 sm:pr-12 text-left text-sm text-muted-foreground transition-colors outline-none hover:bg-muted/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
      >
        Search items...
      </button>
      {/* No hint on phones: there's no keyboard, and the top bar logo needs the room. */}
      <Kbd className="pointer-events-none absolute top-1/2 right-2 hidden -translate-y-1/2 sm:inline-flex">⌘K</Kbd>
    </div>
  );
}
