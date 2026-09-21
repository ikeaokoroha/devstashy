import { ItemCard } from "@/components/dashboard/ItemCard";
import type { ItemWithType } from "@/types/dashboard";

interface ItemGridProps {
  items: ItemWithType[];
  emptyMessage: string;
}

export function ItemGrid({ items, emptyMessage }: ItemGridProps) {
  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed px-6 py-12 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  // Columns follow the grid's own width rather than the viewport, since the
  // collapsible sidebar changes how much room there is at the same screen size.
  // Both breakpoints keep each card at least ~280px wide.
  return (
    <div className="@container">
      <div className="grid gap-3 @xl:grid-cols-2 @4xl:grid-cols-3">
        {items.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
