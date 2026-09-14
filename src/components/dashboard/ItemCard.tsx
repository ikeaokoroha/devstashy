import { Pin, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getItemTypeStyle } from "@/lib/item-types";
import type { ItemWithType } from "@/types/dashboard";

// Format in UTC so the rendered date doesn't depend on the server's time zone.
const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

interface ItemCardProps {
  item: ItemWithType;
}

export function ItemCard({ item }: ItemCardProps) {
  const { icon: Icon, textClass, borderClass, bgClass } = getItemTypeStyle(
    item.itemType.name
  );

  return (
    <Card className={cn("flex-row items-start gap-4 border-l-2 px-5", borderClass)}>
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-lg",
          bgClass
        )}
      >
        <Icon aria-label={item.itemType.name} className={cn("size-5", textClass)} />
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-medium">{item.title}</h3>
          {item.isPinned && (
            <Pin aria-label="Pinned" className="size-3.5 shrink-0 text-muted-foreground" />
          )}
          {item.isFavorite && (
            <Star
              aria-label="Favorite"
              className="size-3.5 shrink-0 fill-yellow-400 text-yellow-400"
            />
          )}
        </div>
        {item.description && (
          <p className="line-clamp-1 text-sm text-muted-foreground">
            {item.description}
          </p>
        )}
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {item.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <time
        dateTime={item.updatedAt.toISOString()}
        className="shrink-0 text-xs text-muted-foreground"
      >
        {DATE_FORMATTER.format(item.updatedAt)}
      </time>
    </Card>
  );
}
