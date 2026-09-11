import { Clock, Pin } from "lucide-react";
import { ItemSection } from "@/components/dashboard/ItemSection";
import { RecentCollections } from "@/components/dashboard/RecentCollections";
import { StatsCards } from "@/components/dashboard/StatsCards";
import {
  getDashboardStats,
  getPinnedItems,
  getRecentCollections,
  getRecentItems,
} from "@/lib/dashboard-data";

const RECENT_COLLECTIONS_LIMIT = 6;
const RECENT_ITEMS_LIMIT = 10;

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">Your developer knowledge hub</p>
      </div>

      <StatsCards stats={getDashboardStats()} />
      <RecentCollections
        collections={getRecentCollections(RECENT_COLLECTIONS_LIMIT)}
      />
      <ItemSection title="Pinned" icon={Pin} items={getPinnedItems()} />
      <ItemSection
        title="Recent Items"
        icon={Clock}
        items={getRecentItems(RECENT_ITEMS_LIMIT)}
      />
    </div>
  );
}
