"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronsUpDown, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import type { ItemCollectionRef } from "@/types/items";

const LOAD_ERROR = "Couldn't load your collections.";

type CollectionsState =
  | { status: "loading" }
  | { status: "loaded"; collections: ItemCollectionRef[] }
  | { status: "error"; error: string };

interface CollectionPickerProps {
  value: string[];
  onChange: (collectionIds: string[]) => void;
  error?: string;
}

// A searchable dropdown over the user's collections, so the field stays the same
// size whether they have three collections or three hundred. Fetched on mount
// rather than passed down, so both item forms use one source.
export function CollectionPicker({ value, onChange, error }: CollectionPickerProps) {
  const [state, setState] = useState<CollectionsState>({ status: "loading" });
  const [open, setOpen] = useState(false);

  // No synchronous setState here: the state starts out loading, and the retry
  // below is the only caller that has to put it back.
  const load = useCallback((signal?: AbortSignal) => {
    fetch("/api/collections", { signal })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok || !body.success) {
          throw new Error(body.error ?? LOAD_ERROR);
        }
        setState({ status: "loaded", collections: body.data });
      })
      .catch((cause: unknown) => {
        if (signal?.aborted) {
          return;
        }
        setState({
          status: "error",
          error: cause instanceof Error ? cause.message : LOAD_ERROR,
        });
      });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  function retry() {
    setState({ status: "loading" });
    load();
  }

  function toggle(collectionId: string) {
    onChange(
      value.includes(collectionId)
        ? value.filter((id) => id !== collectionId)
        : [...value, collectionId]
    );
  }

  const errorId = error ? "collections-error" : undefined;

  return (
    <div className="grid gap-2">
      <Label id="item-collections">Collections</Label>

      {state.status === "loading" && (
        <Skeleton aria-label="Loading collections" className="h-9 w-full rounded-lg" />
      )}

      {state.status === "error" && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{state.error}</span>
          <Button type="button" variant="outline" size="sm" onClick={retry}>
            Try again
          </Button>
        </div>
      )}

      {state.status === "loaded" &&
        (state.collections.length === 0 ? (
          <p className="rounded-lg border border-dashed px-3 py-2.5 text-sm text-muted-foreground">
            No collections yet. Create one from the top bar to group items.
          </p>
        ) : (
          <CollectionCombobox
            collections={state.collections}
            value={value}
            open={open}
            onOpenChange={setOpen}
            onToggle={toggle}
            describedBy={errorId}
          />
        ))}

      {error && (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

interface CollectionComboboxProps {
  collections: ItemCollectionRef[];
  value: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToggle: (collectionId: string) => void;
  describedBy?: string;
}

function CollectionCombobox({
  collections,
  value,
  open,
  onOpenChange,
  onToggle,
  describedBy,
}: CollectionComboboxProps) {
  const selected = collections.filter((collection) => value.includes(collection.id));

  // cmdk matches on an item's value, which it lowercases; the ids are the values
  // here so two collections of the same name stay distinct, so the search has to
  // be pointed back at the names.
  const nameById = new Map(
    collections.map((collection) => [collection.id.toLowerCase(), collection.name.toLowerCase()])
  );

  return (
    <>
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger
          render={<Button type="button" variant="outline" className="h-9 w-full justify-between font-normal" />}
          aria-labelledby="item-collections"
          aria-describedby={describedBy}
        >
          <span className={selected.length === 0 ? "text-muted-foreground" : undefined}>
            {selected.length === 0
              ? "Add to collections"
              : selected.length === 1
                ? selected[0].name
                : `${selected.length} collections`}
          </span>
          <ChevronsUpDown className="text-muted-foreground" />
        </PopoverTrigger>
        <PopoverContent align="start" className="w-(--anchor-width) min-w-64 p-0">
          <Command
            filter={(itemValue, search) =>
              (nameById.get(itemValue) ?? "").includes(search.toLowerCase()) ? 1 : 0
            }
          >
            <CommandInput placeholder="Search collections…" />
            <CommandList>
              <CommandEmpty>No collections found.</CommandEmpty>
              {collections.map((collection) => (
                <CommandItem
                  key={collection.id}
                  value={collection.id}
                  data-checked={value.includes(collection.id)}
                  // cmdk hands onSelect the lowercased value, so the id comes
                  // from the closure instead.
                  onSelect={() => onToggle(collection.id)}
                >
                  <span className="truncate">{collection.name}</span>
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* The selection stays readable without reopening the dropdown. */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((collection) => (
            <button
              key={collection.id}
              type="button"
              onClick={() => onToggle(collection.id)}
              aria-label={`Remove from ${collection.name}`}
              className="inline-flex h-6 max-w-full items-center gap-1 rounded-md border bg-muted/40 pr-1 pl-2 text-xs font-medium text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <span className="truncate">{collection.name}</span>
              <X className="size-3 shrink-0" />
            </button>
          ))}
        </div>
      )}
    </>
  );
}
