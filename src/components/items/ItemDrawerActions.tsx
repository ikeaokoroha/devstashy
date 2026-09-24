"use client";

import { Check, Copy, Download, Pencil } from "lucide-react";

import { FavoriteButton } from "@/components/shared/FavoriteButton";
import { PinButton } from "@/components/shared/PinButton";
import { Button } from "@/components/ui/button";
import { useCopyToClipboard, type CopyStatus } from "@/hooks/use-copy-to-clipboard";
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
  // Set only for a loaded item that holds a file.
  downloadUrl: string | null;
  // Null until the full item has loaded.
  onEdit: (() => void) | null;
  onDeleted: () => void;
}

// Every action works: Favorite, Pin, Copy, Download, Edit and Delete.
export function ItemDrawerActions({
  itemId,
  title,
  isFavorite,
  isPinned,
  copyText,
  downloadUrl,
  onEdit,
  onDeleted,
}: ItemDrawerActionsProps) {
  const { status: copyStatus, copy } = useCopyToClipboard();

  function handleCopy() {
    if (copyText) void copy(copyText);
  }

  return (
    <div className="flex items-center gap-1">
      <FavoriteButton kind="item" id={itemId} name={title} isFavorite={isFavorite} showLabel />
      <PinButton itemId={itemId} isPinned={isPinned} />
      <Button variant="ghost" size="sm" disabled={!copyText} onClick={handleCopy}>
        {copyStatus === "copied" ? <Check /> : <Copy />}
        {COPY_LABELS[copyStatus]}
      </Button>
      {downloadUrl && (
        // Served from our own origin, so the browser saves the file under its
        // original name instead of navigating to the R2 URL.
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<a href={downloadUrl} download />}
        >
          <Download />
          Download
        </Button>
      )}

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
