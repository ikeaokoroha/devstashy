import type { Metadata } from "next";
import { Star } from "lucide-react";

import { FavoriteCollectionRow } from "@/components/favorites/FavoriteCollectionRow";
import { FavoriteItemRow } from "@/components/favorites/FavoriteItemRow";
import { FavoritesSection } from "@/components/favorites/FavoritesSection";
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
        // Each section is dropped when empty rather than showing a zero, so a
        // page of only items doesn't carry an empty Collections heading.
        <div className="space-y-6">
          {items.length > 0 && (
            <FavoritesSection title="Items" count={items.length}>
              {items.map((item) => (
                <FavoriteItemRow key={item.id} item={item} />
              ))}
            </FavoritesSection>
          )}

          {collections.length > 0 && (
            <FavoritesSection title="Collections" count={collections.length}>
              {collections.map((collection) => (
                <FavoriteCollectionRow key={collection.id} collection={collection} />
              ))}
            </FavoritesSection>
          )}
        </div>
      )}
    </div>
  );
}
