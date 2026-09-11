import { Folder, FolderHeart, Layers, Star, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { DashboardStats } from "@/types/dashboard";

interface StatsCardsProps {
  stats: DashboardStats;
}

interface StatCard {
  label: string;
  value: number;
  icon: LucideIcon;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards: StatCard[] = [
    { label: "Items", value: stats.totalItems, icon: Layers },
    { label: "Collections", value: stats.totalCollections, icon: Folder },
    { label: "Favorite Items", value: stats.favoriteItems, icon: Star },
    {
      label: "Favorite Collections",
      value: stats.favoriteCollections,
      icon: FolderHeart,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map(({ label, value, icon: Icon }) => (
        <Card key={label} className="gap-2 px-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Icon className="size-4 shrink-0" />
            <span className="truncate text-sm">{label}</span>
          </div>
          <p className="text-2xl font-semibold">{value}</p>
        </Card>
      ))}
    </div>
  );
}
