"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";

import { useItemDrawer } from "@/components/items/ItemDrawerProvider";
import type { SearchCollection, SearchDataState, SearchItem } from "@/types/search";
import { CommandPalette } from "./CommandPalette";

interface SearchContextValue {
  openSearch: () => void;
}

const SearchContext = createContext<SearchContextValue | null>(null);

const LOAD_ERROR = "Couldn't load your search results. Please try again.";

// Holds the command palette for the signed-in shell: the searchable data, the
// ⌘K shortcut and the top bar's trigger all go through here. It sits inside
// ItemDrawerProvider, so selecting an item opens the same drawer a card does.
export function SearchProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<SearchDataState>({ status: "loading" });
  const requestRef = useRef<AbortController | null>(null);
  const router = useRouter();
  const { openItem } = useItemDrawer();

  // Refetches, dropping any response still in flight. Data already loaded is
  // kept on failure, so a dropped refresh leaves the palette searchable.
  const refresh = useCallback(() => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;

    fetch("/api/search", { signal: controller.signal })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok || !body.success) {
          throw new Error(body.error ?? LOAD_ERROR);
        }
        setState({ status: "loaded", data: body.data });
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        setState((current) =>
          current.status === "loaded"
            ? current
            : { status: "error", error: cause instanceof Error ? cause.message : LOAD_ERROR }
        );
      });
  }, []);

  // Pre-fetched when the shell mounts, so the first ⌘K opens on results.
  useEffect(() => {
    refresh();
    return () => requestRef.current?.abort();
  }, [refresh]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);
      // Opening revalidates in the background, so items created or renamed
      // since the last fetch show up without the palette waiting on the round trip.
      if (nextOpen) {
        refresh();
      }
    },
    [refresh]
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        // Both Chrome and Firefox bind ⌘K/Ctrl+K to their own search bar.
        event.preventDefault();
        handleOpenChange(!open);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleOpenChange, open]);

  const handleSelectItem = useCallback(
    (item: SearchItem) => {
      setOpen(false);
      openItem(item);
    },
    [openItem]
  );

  const handleSelectCollection = useCallback(
    (collection: SearchCollection) => {
      setOpen(false);
      router.push(`/collections/${collection.id}`);
    },
    [router]
  );

  const value = useMemo(() => ({ openSearch: () => handleOpenChange(true) }), [handleOpenChange]);

  return (
    <SearchContext.Provider value={value}>
      {children}
      <CommandPalette
        open={open}
        onOpenChange={handleOpenChange}
        state={state}
        onRetry={() => {
          setState({ status: "loading" });
          refresh();
        }}
        onSelectItem={handleSelectItem}
        onSelectCollection={handleSelectCollection}
      />
    </SearchContext.Provider>
  );
}

export function useSearch(): SearchContextValue {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error("useSearch must be used within a SearchProvider");
  }
  return context;
}
