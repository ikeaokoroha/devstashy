import Link from "next/link";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { getItemTypeStyle } from "@/lib/item-types";
import type { CollectionSummary } from "@/types/dashboard";

interface CollectionCardProps {
  collection: CollectionSummary;
}

export function CollectionCard({ collection }: CollectionCardProps) {
  const { borderClass } = getItemTypeStyle(collection.itemTypes[0]?.name ?? "");

  return (
    <Link
      href={`/collections/${collection.id}`}
      className="group/collection rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Card
        className={cn(
          "h-full gap-3 border-l-2 px-5 py-5 transition-colors group-hover/collection:bg-accent/50",
          borderClass
        )}
      >
        <div>
          <div className="flex items-center gap-2">
            <h3 className="truncate font-medium">{collection.name}</h3>
            {collection.isFavorite && (
              <Star
                aria-label="Favorite"
                className="size-4 shrink-0 fill-yellow-400 text-yellow-400"
              />
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {collection.itemCount}{" "}
            {collection.itemCount === 1 ? "item" : "items"}
          </p>
        </div>

        {collection.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {collection.description}
          </p>
        )}

        <div className="mt-auto flex gap-2">
          {collection.itemTypes.map((type) => {
            const { icon: Icon, textClass } = getItemTypeStyle(type.name);
            return (
              <Icon
                key={type.id}
                aria-label={type.name}
                className={cn("size-4", textClass)}
              />
            );
          })}
        </div>
      </Card>
    </Link>
  );
}
