"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

import type { ItemWithType } from "@/types/dashboard";
import type { ItemDetailJson, ItemDetailState } from "@/types/items";
import { ItemDrawer } from "./ItemDrawer";

interface ItemDrawerContextValue {
  openItem: (item: ItemWithType) => void;
}

const ItemDrawerContext = createContext<ItemDrawerContextValue | null>(null);

const LOAD_ERROR = "Couldn't load this item. Please try again.";

async function fetchItemDetail(id: string, signal: AbortSignal): Promise<ItemDetailState> {
  const response = await fetch(`/api/items/${encodeURIComponent(id)}`, { signal });
  const body: { success: boolean; data?: ItemDetailJson; error?: string } = await response
    .json()
    .catch(() => ({ success: false }));

  if (!response.ok || !body.success || !body.data) {
    return { status: "error", error: body.error ?? LOAD_ERROR };
  }
  return { status: "loaded", item: body.data };
}

// Holds the drawer's state for the signed-in shell, so server-rendered item
// cards anywhere under it can open an item without navigating.
export function ItemDrawerProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  // The clicked card's data, shown right away while the full detail loads.
  const [preview, setPreview] = useState<ItemWithType | null>(null);
  const [detail, setDetail] = useState<ItemDetailState>({ status: "loading" });
  const requestRef = useRef<AbortController | null>(null);

  const openItem = useCallback((item: ItemWithType) => {
    // A newer click wins: drop any response still in flight for the previous item.
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;

    setPreview(item);
    setDetail({ status: "loading" });
    setOpen(true);

    fetchItemDetail(item.id, controller.signal)
      .then(setDetail)
      .catch(() => {
        if (!controller.signal.aborted) {
          setDetail({ status: "error", error: LOAD_ERROR });
        }
      });
  }, []);

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    if (!nextOpen) {
      requestRef.current?.abort();
    }
    setOpen(nextOpen);
  }, []);

  const value = useMemo(() => ({ openItem }), [openItem]);

  return (
    <ItemDrawerContext.Provider value={value}>
      {children}
      <ItemDrawer
        open={open}
        onOpenChange={handleOpenChange}
        preview={preview}
        detail={detail}
        onRetry={() => preview && openItem(preview)}
      />
    </ItemDrawerContext.Provider>
  );
}

export function useItemDrawer(): ItemDrawerContextValue {
  const context = useContext(ItemDrawerContext);
  if (!context) {
    throw new Error("useItemDrawer must be used within an ItemDrawerProvider");
  }
  return context;
}
