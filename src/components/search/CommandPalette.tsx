"use client";

import { useState } from "react";
import { Folder } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { getItemTypeStyle } from "@/lib/item-types";
import { searchAll } from "@/lib/search";
import { cn } from "@/lib/utils";
import type { SearchCollection, SearchDataState, SearchItem } from "@/types/search";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  state: SearchDataState;
  onRetry: () => void;
  onSelectItem: (item: SearchItem) => void;
  onSelectCollection: (collection: SearchCollection) => void;
}

// ⌘K search over the user's items and collections. Matching and ranking happen
// here over the pre-fetched data, so cmdk's own filter is off and the rows are
// rendered in the order searchAll returns them.
export function CommandPalette({
  open,
  onOpenChange,
  state,
  onRetry,
  onSelectItem,
  onSelectCollection,
}: CommandPaletteProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* The dialog is named for screen readers only; the input is the visible label. */}
      <DialogContent
        showCloseButton={false}
        className="top-1/3 max-w-[calc(100%-2rem)] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-lg"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Search</DialogTitle>
          <DialogDescription>Search your items and collections.</DialogDescription>
        </DialogHeader>

        {/* The query lives in here, which the dialog unmounts on close, so every
            open starts blank on the most recent items. */}
        <PaletteSearch
          state={state}
          onRetry={onRetry}
          onSelectItem={onSelectItem}
          onSelectCollection={onSelectCollection}
        />
      </DialogContent>
    </Dialog>
  );
}

type PaletteSearchProps = Omit<CommandPaletteProps, "open" | "onOpenChange">;

function PaletteSearch({ state, onRetry, onSelectItem, onSelectCollection }: PaletteSearchProps) {
  const [query, setQuery] = useState("");

  const results = state.status === "loaded" ? searchAll(state.data, query) : null;
  const isEmpty = results !== null && results.items.length === 0 && results.collections.length === 0;

  return (
    <Command shouldFilter={false} className="bg-transparent">
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder="Search items and collections..."
      />
      <CommandList className="mt-1">
        {state.status === "loading" && <PaletteSkeleton />}

        {state.status === "error" && (
          <div className="space-y-3 px-2 py-6 text-center">
            <p className="text-sm text-muted-foreground">{state.error}</p>
            <Button variant="outline" size="sm" onClick={onRetry}>
              Try again
            </Button>
          </div>
        )}

        {isEmpty && (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">
            {query.trim() === ""
              ? "Nothing to search yet. Create an item or a collection to get started."
              : "No matching items or collections."}
          </p>
        )}

        {results && results.items.length > 0 && (
          <CommandGroup heading="Items">
            {results.items.map((item) => (
              <ItemRow key={item.id} item={item} onSelect={() => onSelectItem(item)} />
            ))}
          </CommandGroup>
        )}

        {results && results.collections.length > 0 && (
          <CommandGroup heading="Collections">
            {results.collections.map((collection) => (
              <CommandItem
                key={collection.id}
                // cmdk needs one unique value per row, and an item and a
                // collection could carry the same id.
                value={`collection:${collection.id}`}
                onSelect={() => onSelectCollection(collection)}
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted">
                  <Folder aria-hidden className="size-3.5 text-muted-foreground" />
                </span>
                <span className="truncate">{collection.name}</span>
                <CommandShortcut className="tracking-normal">
                  {collection.itemCount} {collection.itemCount === 1 ? "item" : "items"}
                </CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </Command>
  );
}

function ItemRow({ item, onSelect }: { item: SearchItem; onSelect: () => void }) {
  const { icon: Icon, textClass, bgClass } = getItemTypeStyle(item.itemType.name);

  return (
    <CommandItem value={`item:${item.id}`} onSelect={onSelect}>
      <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-md", bgClass)}>
        <Icon aria-hidden className={cn("size-3.5", textClass)} />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="truncate">{item.title}</span>
        {item.preview && (
          <span className="truncate text-xs text-muted-foreground">{item.preview}</span>
        )}
      </span>
      <CommandShortcut className="capitalize tracking-normal">{item.itemType.name}</CommandShortcut>
    </CommandItem>
  );
}

function PaletteSkeleton() {
  return (
    <div aria-label="Loading search results" className="space-y-2 p-2">
      {[0, 1, 2].map((row) => (
        <Skeleton key={row} className="h-8 w-full rounded-lg" />
      ))}
    </div>
  );
}
