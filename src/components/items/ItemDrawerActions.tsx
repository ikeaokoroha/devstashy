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
    // The drawer is only 281px wide on a phone, which the labelled buttons overflow,
    // pushing Delete off the right edge. Each label hides below sm so the row keeps
    // the same shape as on desktop; flex-wrap is just a floor for a very narrow
    // screen, and Edit and Delete share a wrapper so they'd wrap together.
    <div className="flex flex-wrap items-center gap-1 gap-y-2">
      <FavoriteButton
        kind="item"
        id={itemId}
        name={title}
        isFavorite={isFavorite}
        showLabel
        labelClassName="hidden sm:inline"
      />
      <PinButton itemId={itemId} isPinned={isPinned} />
      <Button
        variant="ghost"
        size="sm"
        disabled={!copyText}
        // The status is the confirmation, so it has to reach the accessible name
        // too once the visible label is hidden.
        aria-label={COPY_LABELS[copyStatus]}
        title={COPY_LABELS[copyStatus]}
        onClick={handleCopy}
      >
        {copyStatus === "copied" ? <Check /> : <Copy />}
        <span className="hidden sm:inline">{COPY_LABELS[copyStatus]}</span>
      </Button>
      {downloadUrl && (
        // Served from our own origin, so the browser saves the file under its
        // original name instead of navigating to the R2 URL.
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          aria-label="Download"
          title="Download"
          render={<a href={downloadUrl} download />}
        >
          <Download />
          <span className="hidden sm:inline">Download</span>
        </Button>
      )}

      <div className="ml-auto flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          aria-label="Edit"
          title="Edit"
          disabled={!onEdit}
          onClick={onEdit ?? undefined}
        >
          <Pencil />
          <span className="hidden sm:inline">Edit</span>
        </Button>
        <DeleteItemDialog itemId={itemId} title={title} onDeleted={onDeleted} />
      </div>
    </div>
  );
}
