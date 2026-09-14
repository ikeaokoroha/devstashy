import { Clock, Pin } from "lucide-react";
import { ItemSection } from "@/components/dashboard/ItemSection";
import { RecentCollections } from "@/components/dashboard/RecentCollections";
import { StatsCards } from "@/components/dashboard/StatsCards";
import {
  getItemStats,
  getPinnedItems,
  getRecentItems,
} from "@/lib/dashboard-data";
import { getCollectionStats, getRecentCollections } from "@/lib/db/collections";
import { getCurrentUserId } from "@/lib/db/users";

const RECENT_COLLECTIONS_LIMIT = 6;
const RECENT_ITEMS_LIMIT = 10;

export default async function DashboardPage() {
  const userId = await getCurrentUserId();
  const [collectionStats, recentCollections] = await Promise.all([
    getCollectionStats(userId),
    getRecentCollections(userId, RECENT_COLLECTIONS_LIMIT),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">Your developer knowledge hub</p>
      </div>

      <StatsCards stats={{ ...getItemStats(), ...collectionStats }} />
      <RecentCollections collections={recentCollections} />
      <ItemSection title="Pinned" icon={Pin} items={getPinnedItems()} />
      <ItemSection
        title="Recent Items"
        icon={Clock}
        items={getRecentItems(RECENT_ITEMS_LIMIT)}
      />
    </div>
  );
}
