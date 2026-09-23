import { Download, Pin, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { OpenItemButton } from "@/components/items/OpenItemButton";
import { getFileIcon } from "@/lib/file-icons";
import { formatFileSize } from "@/lib/item-detail";
import type { ItemWithType } from "@/types/dashboard";

// Format in UTC so the rendered date doesn't depend on the server's time zone.
const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

interface FileRowProps {
  item: ItemWithType;
}

export function FileRow({ item }: FileRowProps) {
  const { icon: Icon } = getFileIcon(item.fileName);
  // The title leads, with the uploaded filename underneath — dropped when it
  // only repeats the title, or when the item somehow has no file.
  const fileName = item.fileName !== item.title ? item.fileName : null;

  return (
    <div className="relative flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/40">
      <OpenItemButton item={item} className="rounded-none" />

      <span className="flex size-10 shrink-0 items-center justify-center rounded-md border bg-muted/40">
        <Icon aria-hidden className="size-5 text-muted-foreground" />
      </span>

      {/* Stacked on a narrow list, one row from @md up. */}
      <div className="min-w-0 flex-1 @md:flex @md:items-center @md:gap-4">
        <div className="min-w-0 @md:flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-medium">{item.title}</p>
            {item.isPinned && (
              <Pin aria-label="Pinned" className="size-4 shrink-0 text-muted-foreground" />
            )}
            {item.isFavorite && (
              <Star
                aria-label="Favorite"
                className="size-4 shrink-0 fill-yellow-400 text-yellow-400"
              />
            )}
          </div>
          {fileName && (
            <p className="truncate text-sm text-muted-foreground">{fileName}</p>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-sm text-muted-foreground @md:shrink-0">
          {item.fileSize !== null && (
            <>
              <span>{formatFileSize(item.fileSize)}</span>
              <span aria-hidden>·</span>
            </>
          )}
          <time dateTime={item.updatedAt.toISOString()}>
            {DATE_FORMATTER.format(item.updatedAt)}
          </time>
        </div>
      </div>

      {/* Above the row's overlay button, which would otherwise swallow the click. */}
      {item.fileUrl && (
        <Button
          variant="ghost"
          size="icon"
          nativeButton={false}
          aria-label={`Download ${item.title}`}
          className="relative z-10 shrink-0"
          render={<a href={`/api/items/${item.id}/download`} download />}
        >
          <Download />
        </Button>
      )}
    </div>
  );
}
