"use client";

import { Star } from "lucide-react";

import { toggleCollectionFavorite } from "@/actions/collections";
import { toggleItemFavorite } from "@/actions/items";
import { Button } from "@/components/ui/button";
import { useToggleFlag } from "@/hooks/use-toggle-flag";
import { cn } from "@/lib/utils";
import type { ActionResult } from "@/types/actions";

type FavoriteKind = "item" | "collection";

type ToggleAction = (id: string, isFavorite: boolean) => Promise<ActionResult>;

const SAVE_ACTIONS: Record<FavoriteKind, ToggleAction> = {
  item: toggleItemFavorite,
  collection: toggleCollectionFavorite,
};

const ERROR_MESSAGES: Record<FavoriteKind, string> = {
  item: "Couldn't update this item. Please try again.",
  collection: "Couldn't update this collection. Please try again.",
};

interface FavoriteButtonProps {
  kind: FavoriteKind;
  id: string;
  // The item or collection name, for the label an icon-only button has no room to show.
  name: string;
  isFavorite: boolean;
  // Labelled in the item drawer and the collection header, icon only on a card.
  showLabel?: boolean;
  // Applied to the visible label, so a caller can hide it at narrow widths while
  // keeping the button's size. The accessible name doesn't depend on it.
  labelClassName?: string;
  // Smaller where a card's row is shorter than a full button (see ItemCard).
  size?: "icon" | "icon-sm";
  className?: string;
}

// The favorite star, wherever an item or collection is shown. The card and row
// call sites stay server components: this is the only client part, and it sits
// above their overlay link or OpenItemButton so favoriting doesn't also open the
// item or navigate to the collection.
export function FavoriteButton({
  kind,
  id,
  name,
  isFavorite: serverValue,
  showLabel = false,
  labelClassName,
  size = "icon",
  className,
}: FavoriteButtonProps) {
  // No success toast: the star fills in place, and one toast per click would be
  // noise across a grid of cards.
  const { value: isFavorite, toggle } = useToggleFlag({
    value: serverValue,
    save: (next) => SAVE_ACTIONS[kind](id, next),
    errorMessage: ERROR_MESSAGES[kind],
  });

  const label = isFavorite ? `Remove ${name} from favorites` : `Add ${name} to favorites`;

  return (
    <Button
      variant="ghost"
      size={showLabel ? "sm" : size}
      aria-pressed={isFavorite}
      // Always spelled out, since a caller may hide the visible label responsively
      // and display:none text is dropped from the accessibility tree.
      aria-label={label}
      title={label}
      onClick={toggle}
      className={cn(
        "relative z-10 shrink-0",
        // Always visible rather than hover-only, so the star is reachable on
        // touch, and dimmed until hovered so a grid of cards stays quiet.
        !showLabel &&
          "text-muted-foreground opacity-70 transition-opacity hover:opacity-100 focus-visible:opacity-100",
        className
      )}
    >
      <Star className={cn(isFavorite && "fill-yellow-400 text-yellow-400")} />
      {showLabel && (
        <span className={cn(isFavorite && "text-yellow-400", labelClassName)}>Favorite</span>
      )}
    </Button>
  );
}
