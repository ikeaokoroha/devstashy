import { Clock, Pin } from "lucide-react";
import { ItemSection } from "@/components/dashboard/ItemSection";
import { RecentCollections } from "@/components/dashboard/RecentCollections";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { getCollectionStats, getRecentCollections } from "@/lib/db/collections";
import { getItemStats, getPinnedItems, getRecentItems } from "@/lib/db/items";
import {
  DASHBOARD_COLLECTIONS_LIMIT,
  DASHBOARD_RECENT_ITEMS_LIMIT,
} from "@/lib/pagination";
import { requireUserId } from "@/lib/session";

const PINNED_ITEMS_LIMIT = 10;

export default async function DashboardPage() {
  const userId = await requireUserId();
  const [itemStats, collectionStats, recentCollections, pinnedItems, recentItems] =
    await Promise.all([
      getItemStats(userId),
      getCollectionStats(userId),
      getRecentCollections(userId, DASHBOARD_COLLECTIONS_LIMIT),
      getPinnedItems(userId, PINNED_ITEMS_LIMIT),
      getRecentItems(userId, DASHBOARD_RECENT_ITEMS_LIMIT),
    ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">Your developer knowledge hub</p>
      </div>

      <StatsCards stats={{ ...itemStats, ...collectionStats }} />
      <RecentCollections collections={recentCollections} />
      <ItemSection title="Pinned" icon={Pin} items={pinnedItems} />
      <ItemSection title="Recent Items" icon={Clock} items={recentItems} />
    </div>
  );
}
