"use client";

import type { ItemWithType } from "@/types/dashboard";
import { useItemDrawer } from "./ItemDrawerProvider";

// Covers its (relatively positioned) card so the whole card opens the item
// drawer, while ItemCard itself stays a server component.
export function OpenItemButton({ item }: { item: ItemWithType }) {
  const { openItem } = useItemDrawer();

  return (
    <button
      type="button"
      aria-label={`Open ${item.title}`}
      onClick={() => openItem(item)}
      className="absolute inset-0 rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    />
  );
}
