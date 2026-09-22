"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, Pencil, Pin, Star, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const COPY_FEEDBACK_MS = 2000;

type CopyStatus = "idle" | "copied" | "failed";

const COPY_LABELS: Record<CopyStatus, string> = {
  idle: "Copy",
  copied: "Copied",
  failed: "Copy failed",
};

interface ItemDrawerActionsProps {
  isFavorite: boolean;
  isPinned: boolean;
  // Null while the item loads, or when it has nothing to copy.
  copyText: string | null;
  // Null until the full item has loaded.
  onEdit: (() => void) | null;
}

// Copy and Edit work; Favorite, Pin and Delete are display only for now.
export function ItemDrawerActions({ isFavorite, isPinned, copyText, onEdit }: ItemDrawerActionsProps) {
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(resetTimer.current), []);

  async function handleCopy() {
    if (!copyText) return;
    try {
      await navigator.clipboard.writeText(copyText);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
    clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setCopyStatus("idle"), COPY_FEEDBACK_MS);
  }

  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="sm" aria-pressed={isFavorite}>
        <Star className={cn(isFavorite && "fill-yellow-400 text-yellow-400")} />
        <span className={cn(isFavorite && "text-yellow-400")}>Favorite</span>
      </Button>
      <Button variant="ghost" size="sm" aria-pressed={isPinned}>
        <Pin className={cn(isPinned && "fill-current")} />
        Pin
      </Button>
      <Button variant="ghost" size="sm" disabled={!copyText} onClick={handleCopy}>
        {copyStatus === "copied" ? <Check /> : <Copy />}
        {COPY_LABELS[copyStatus]}
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className="ml-auto"
        disabled={!onEdit}
        onClick={onEdit ?? undefined}
      >
        <Pencil />
        Edit
      </Button>
      <Button variant="ghost" size="icon-sm" aria-label="Delete" className="text-destructive hover:text-destructive">
        <Trash2 />
      </Button>
    </div>
  );
}
