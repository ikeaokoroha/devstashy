import Image from "next/image";
import { ImageIcon, Pin, Star } from "lucide-react";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { CopyItemButton } from "@/components/items/CopyItemButton";
import { OpenItemButton } from "@/components/items/OpenItemButton";
import { getCardCopyText } from "@/lib/item-detail";
import { getItemTypeStyle } from "@/lib/item-types";
import type { ItemWithType } from "@/types/dashboard";

// Format in UTC so the rendered date doesn't depend on the server's time zone.
const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

// Roughly a third of the content column on a wide screen, which is the most a
// tile is ever displayed at; the src set covers the narrower breakpoints.
const THUMBNAIL_SIZES = "(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 400px";

interface ImageCardProps {
  item: ItemWithType;
  // Set on the grid's leading tiles when the grid is a page's first content, so
  // the one the browser picks as LCP isn't lazily loaded.
  priority?: boolean;
}

export function ImageCard({ item, priority = false }: ImageCardProps) {
  const { icon: Icon, textClass, borderClass } = getItemTypeStyle(item.itemType.name);
  const copyText = getCardCopyText(item);

  return (
    <Card
      className={cn(
        "group relative gap-0 overflow-hidden border-t-2 p-0 transition-colors hover:bg-muted/40",
        borderClass
      )}
    >
      {/* Above the thumbnail: `fill` needs a positioned wrapper, and a
          positioned sibling would otherwise paint over the overlay. */}
      <OpenItemButton item={item} className="z-10" />

      <div className="relative aspect-video overflow-hidden bg-muted/40">
        {item.fileUrl ? (
          <Image
            src={item.fileUrl}
            // The filename is the only description we hold; the title is what a
            // sighted user reads underneath, so it's the better alt text.
            alt={item.title}
            fill
            sizes={THUMBNAIL_SIZES}
            priority={priority}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <ImageIcon aria-label="No image" className="size-8 text-muted-foreground" />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 px-4 py-3">
        <Icon aria-label={item.itemType.name} className={cn("size-4 shrink-0", textClass)} />
        <h3 className="min-w-0 flex-1 truncate text-sm font-medium">{item.title}</h3>
        {item.isPinned && (
          <Pin aria-label="Pinned" className="size-3.5 shrink-0 text-muted-foreground" />
        )}
        {item.isFavorite && (
          <Star
            aria-label="Favorite"
            className="size-3.5 shrink-0 fill-yellow-400 text-yellow-400"
          />
        )}
        <time
          dateTime={item.updatedAt.toISOString()}
          className="shrink-0 text-xs text-muted-foreground"
        >
          {DATE_FORMATTER.format(item.updatedAt)}
        </time>
        {copyText && (
          // -my-1 keeps the button from making the footer row taller.
          <CopyItemButton
            title={item.title}
            text={copyText}
            size="icon-sm"
            className="-my-1 -mr-1.5"
          />
        )}
      </div>
    </Card>
  );
}
