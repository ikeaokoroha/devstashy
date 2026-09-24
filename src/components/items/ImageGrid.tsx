import { ImageCard } from "@/components/items/ImageCard";
import type { ItemWithType } from "@/types/dashboard";

// One row at the widest breakpoint, which is as much as can be above the fold.
const LEADING_TILES = 3;

interface ImageGridProps {
  items: ItemWithType[];
  emptyMessage: string;
  // True only where the grid is the page's first content. Preloading tiles that
  // sit below a section of cards would cost bandwidth for no paint.
  leading?: boolean;
}

export function ImageGrid({ items, emptyMessage, leading = false }: ImageGridProps) {
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
        {items.map((item, index) => (
          <ImageCard key={item.id} item={item} priority={leading && index < LEADING_TILES} />
        ))}
      </div>
    </div>
  );
}
