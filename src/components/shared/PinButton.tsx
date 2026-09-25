"use client";

import { Pin } from "lucide-react";

import { toggleItemPin } from "@/actions/items";
import { Button } from "@/components/ui/button";
import { useToggleFlag } from "@/hooks/use-toggle-flag";
import { cn } from "@/lib/utils";

interface PinButtonProps {
  itemId: string;
  isPinned: boolean;
}

// Pins an item to the top of its listings. Only the item drawer renders this:
// the pin mark on a card stays a static indicator, so the drawer is the one
// place the state is changed.
export function PinButton({ itemId, isPinned: serverValue }: PinButtonProps) {
  // Unlike the favorite star, the button reads "Pin" either way, so the toast is
  // what confirms which direction the click went.
  const { value: isPinned, toggle } = useToggleFlag({
    value: serverValue,
    save: (next) => toggleItemPin(itemId, next),
    errorMessage: "Couldn't update this item. Please try again.",
    successMessage: (next) => (next ? "Item pinned" : "Item unpinned"),
  });

  return (
    <Button
      variant="ghost"
      size="sm"
      aria-pressed={isPinned}
      // Named here too: the label is hidden on a phone, where the drawer has no
      // room for it, and display:none text is dropped from the accessibility tree.
      aria-label="Pin"
      title="Pin"
      onClick={toggle}
    >
      <Pin className={cn(isPinned && "fill-current")} />
      <span className="hidden sm:inline">Pin</span>
    </Button>
  );
}
