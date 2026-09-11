import type { LucideIcon } from "lucide-react";
import type { ItemWithType } from "@/types/dashboard";
import { ItemCard } from "./ItemCard";

interface ItemSectionProps {
  title: string;
  icon: LucideIcon;
  items: ItemWithType[];
}

export function ItemSection({ title, icon: Icon, items }: ItemSectionProps) {
  if (items.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Icon className="size-4" />
        {title}
      </h2>
      <div className="space-y-3">
        {items.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
