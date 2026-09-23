import { ImageCard } from "@/components/items/ImageCard";
import type { ItemWithType } from "@/types/dashboard";

interface ImageGridProps {
  items: ItemWithType[];
  emptyMessage: string;
}

export function ImageGrid({ items, emptyMessage }: ImageGridProps) {
  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed px-6 py-12 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  // Columns follow the grid's own width rather than the viewport, as in
  // ItemGrid, since the collapsible sidebar changes how much room there is at
  // the same screen size. The breakpoints come earlier than ItemGrid's: a
  // thumbnail tile only needs room for a truncated title, not a full card row.
  return (
    <div className="@container">
      <div className="grid gap-4 @lg:grid-cols-2 @3xl:grid-cols-3">
        {items.map((item) => (
          <ImageCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
