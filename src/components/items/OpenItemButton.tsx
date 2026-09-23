"use client";

import { cn } from "@/lib/utils";
import type { ItemWithType } from "@/types/dashboard";
import { useItemDrawer } from "./ItemDrawerProvider";

interface OpenItemButtonProps {
  item: ItemWithType;
  // For cards with positioned children, which would otherwise paint over the
  // overlay and swallow the click (see ImageCard's thumbnail).
  className?: string;
}

// Covers its (relatively positioned) card so the whole card opens the item
// drawer, while ItemCard itself stays a server component.
export function OpenItemButton({ item, className }: OpenItemButtonProps) {
  const { openItem } = useItemDrawer();

  return (
    <button
      type="button"
      aria-label={`Open ${item.title}`}
      onClick={() => openItem(item)}
      className={cn(
        "absolute inset-0 rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        className
      )}
    />
  );
}
