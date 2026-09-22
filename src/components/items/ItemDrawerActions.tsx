"use client";

import { Check, Copy, Pencil, Pin, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCopyToClipboard, type CopyStatus } from "@/hooks/use-copy-to-clipboard";
import { cn } from "@/lib/utils";
import { DeleteItemDialog } from "./DeleteItemDialog";

const COPY_LABELS: Record<CopyStatus, string> = {
  idle: "Copy",
  copied: "Copied",
  failed: "Copy failed",
};

interface ItemDrawerActionsProps {
  itemId: string;
  title: string;
  isFavorite: boolean;
  isPinned: boolean;
  // Null while the item loads, or when it has nothing to copy.
  copyText: string | null;
  // Null until the full item has loaded.
  onEdit: (() => void) | null;
  onDeleted: () => void;
}

// Copy, Edit and Delete work; Favorite and Pin are display only for now.
export function ItemDrawerActions({
  itemId,
  title,
  isFavorite,
  isPinned,
  copyText,
  onEdit,
  onDeleted,
}: ItemDrawerActionsProps) {
  const { status: copyStatus, copy } = useCopyToClipboard();

  function handleCopy() {
    if (copyText) void copy(copyText);
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
      <DeleteItemDialog itemId={itemId} title={title} onDeleted={onDeleted} />
    </div>
  );
}
