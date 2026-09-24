import Link from "next/link";
import { Folder } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatFavoriteDate } from "@/lib/favorites";
import type { FavoriteCollection } from "@/types/dashboard";

interface FavoriteCollectionRowProps {
  collection: FavoriteCollection;
}

// The row is the link itself rather than a container with an overlay: unlike the
// item rows, nothing here needs a client component, so there's no reason to
// position anything over it.
export function FavoriteCollectionRow({ collection }: FavoriteCollectionRowProps) {
  const { itemCount } = collection;

  return (
    <Link
      href={`/collections/${collection.id}`}
      className="flex items-center gap-3 rounded-sm px-2 py-2 transition-colors hover:bg-muted/40 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
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
    </Link>
  );
}
