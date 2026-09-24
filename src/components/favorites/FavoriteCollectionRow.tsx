import Link from "next/link";
import { Folder } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { FavoriteButton } from "@/components/shared/FavoriteButton";
import { formatFavoriteDate } from "@/lib/favorites";
import type { FavoriteCollection } from "@/types/dashboard";

interface FavoriteCollectionRowProps {
  collection: FavoriteCollection;
}

// The row is a container with an overlay link rather than a Link wrapping
// everything, since the star is a button and a button can't sit inside a link —
// the same restructuring CollectionCard went through for its menu.
export function FavoriteCollectionRow({ collection }: FavoriteCollectionRowProps) {
  const { itemCount } = collection;

  return (
    <div className="relative flex items-center gap-3 px-2 py-2 transition-colors hover:bg-muted/40">
      <Link
        href={`/collections/${collection.id}`}
        aria-label={`Open ${collection.name}`}
        className="absolute inset-0 rounded-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      />

      <Folder aria-hidden className="size-4 shrink-0 text-muted-foreground" />

      <span className="min-w-0 flex-1 truncate font-mono text-sm">{collection.name}</span>

      <Badge
        variant="outline"
        className="hidden shrink-0 font-mono text-[10px] text-muted-foreground sm:inline-flex"
      >
        {itemCount} {itemCount === 1 ? "item" : "items"}
      </Badge>

      <time
        dateTime={collection.updatedAt.toISOString()}
        className="shrink-0 font-mono text-xs text-muted-foreground"
      >
        {formatFavoriteDate(collection.updatedAt)}
      </time>

      {/* Every row on this page is a favorite — that's the query's where clause —
          so the star starts filled and a click drops the row on the refresh. */}
      <FavoriteButton
        kind="collection"
        id={collection.id}
        name={collection.name}
        isFavorite
        size="icon-sm"
        className="-my-1"
      />
    </div>
  );
}
