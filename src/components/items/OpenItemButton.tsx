"use client";

import { cn } from "@/lib/utils";
import type { ItemPreview } from "@/types/dashboard";
import { useItemDrawer } from "./ItemDrawerProvider";

interface OpenItemButtonProps {
  // A preview is all this needs, and all openItem takes, so a favorites row can
  // reuse it without carrying a card's content and file columns.
  item: ItemPreview;
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
