import type { Metadata } from "next";
import { Star } from "lucide-react";

import { FavoritesList } from "@/components/favorites/FavoritesList";
import { getFavoriteCollections } from "@/lib/db/collections";
import { getFavoriteItems } from "@/lib/db/items";
import { FAVORITES_LIMIT } from "@/lib/pagination";
import { requireUserId } from "@/lib/session";

export const metadata: Metadata = { title: "Favorites · Devstashy" };

export default async function FavoritesPage() {
  const userId = await requireUserId();
  const [items, collections] = await Promise.all([
    getFavoriteItems(userId, FAVORITES_LIMIT),
    getFavoriteCollections(userId, FAVORITES_LIMIT),
  ]);

  const total = items.length + collections.length;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-yellow-400/10">
          <Star className="size-5 fill-yellow-400 text-yellow-400" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">Favorites</h1>
          <p className="text-muted-foreground">
            {total} {total === 1 ? "favorite" : "favorites"}
          </p>
        </div>
      </div>

      {total === 0 ? (
        <p className="rounded-lg border border-dashed px-6 py-12 text-center text-sm text-muted-foreground">
          Nothing favorited yet. Star an item or a collection to keep it here.
        </p>
      ) : (
        // The sections and their rows live in a client component so the sort
        // control can reorder them without going back to the server.
        <FavoritesList items={items} collections={collections} />
      )}
    </div>
  );
}
