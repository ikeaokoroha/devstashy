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

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}
