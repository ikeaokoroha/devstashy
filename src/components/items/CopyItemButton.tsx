"use client";

import { Check, Copy, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCopyToClipboard, type CopyStatus } from "@/hooks/use-copy-to-clipboard";
import { cn } from "@/lib/utils";

const COPY_ICONS: Record<CopyStatus, typeof Copy> = {
  idle: Copy,
  copied: Check,
  failed: X,
};

interface CopyItemButtonProps {
  title: string;
  // The text to copy; the caller renders nothing when there's none.
  text: string;
  // Smaller on an image tile, whose footer row is shorter than a card's.
  size?: "icon" | "icon-sm";
  className?: string;
}

// Copies an item's content straight from its card, so grabbing a snippet doesn't
// need the drawer. Icon only, so the icon itself is the confirmation.
export function CopyItemButton({
  title,
  text,
  size = "icon",
  className,
}: CopyItemButtonProps) {
  const { status, copy } = useCopyToClipboard();
  const Icon = COPY_ICONS[status];
  const label =
    status === "copied" ? "Copied" : status === "failed" ? "Copy failed" : `Copy ${title}`;

  return (
    <Button
      variant="ghost"
      size={size}
      aria-label={label}
      title={label}
      onClick={() => void copy(text)}
      // Above the card's OpenItemButton overlay, which would otherwise swallow
      // the click and open the drawer instead.
      className={cn(
        "relative z-10 shrink-0 text-muted-foreground opacity-70 transition-opacity hover:opacity-100 focus-visible:opacity-100",
        className
      )}
    >
      <Icon />
    </Button>
  );
}
