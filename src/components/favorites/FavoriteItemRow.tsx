import { Badge } from "@/components/ui/badge";
import { OpenItemButton } from "@/components/items/OpenItemButton";
import { getItemTypeStyle } from "@/lib/item-types";
import { cn } from "@/lib/utils";
import { formatFavoriteDate } from "@/lib/favorites";
import type { FavoriteItem } from "@/types/dashboard";

interface FavoriteItemRowProps {
  item: FavoriteItem;
}

// A dense favorites row. Like ItemCard, it stays a server component: the
// absolutely positioned OpenItemButton is the only client part, covering the
// row so the whole thing opens the drawer.
export function FavoriteItemRow({ item }: FavoriteItemRowProps) {
  const { icon: Icon, textClass } = getItemTypeStyle(item.itemType.name);

  return (
    <div className="relative flex items-center gap-3 px-2 py-2 transition-colors hover:bg-muted/40">
      <OpenItemButton item={item} className="rounded-sm" />
      <Icon aria-hidden className={cn("size-4 shrink-0", textClass)} />

      <span className="min-w-0 flex-1 truncate font-mono text-sm">{item.title}</span>

      <Badge
        variant="outline"
        className={cn("hidden shrink-0 font-mono text-[10px] sm:inline-flex", textClass)}
      >
        {item.itemType.name}
      </Badge>

      <time
        dateTime={item.updatedAt.toISOString()}
        className="shrink-0 font-mono text-xs text-muted-foreground"
      >
        {formatFavoriteDate(item.updatedAt)}
      </time>
    </div>
  );
}
