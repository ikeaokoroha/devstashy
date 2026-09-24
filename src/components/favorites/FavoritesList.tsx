"use client";

import { useState } from "react";

import { FavoriteCollectionRow } from "@/components/favorites/FavoriteCollectionRow";
import { FavoriteItemRow } from "@/components/favorites/FavoriteItemRow";
import { FavoritesSection } from "@/components/favorites/FavoritesSection";
import { FavoritesSortSelect } from "@/components/favorites/FavoritesSortSelect";
import {
  DEFAULT_FAVORITE_SORT,
  sortFavoriteCollections,
  sortFavoriteItems,
  type FavoriteSort,
} from "@/lib/favorites";
import type { FavoriteCollection, FavoriteItem } from "@/types/dashboard";

interface FavoritesListProps {
  items: FavoriteItem[];
  collections: FavoriteCollection[];
}

// The rows are already on the page, so sorting reorders what's here rather than
// going back to the server: the whole list is one client component holding the
// sort, and the two row components moved to the client with it.
export function FavoritesList({ items, collections }: FavoritesListProps) {
  const [sort, setSort] = useState<FavoriteSort>(DEFAULT_FAVORITE_SORT);

  const sortedItems = sortFavoriteItems(items, sort);
  const sortedCollections = sortFavoriteCollections(collections, sort);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <FavoritesSortSelect value={sort} onChange={setSort} />
      </div>

      {/* Each section is dropped when empty rather than showing a zero, so a
          page of only items doesn't carry an empty Collections heading. */}
      <div className="space-y-6">
        {sortedItems.length > 0 && (
          <FavoritesSection title="Items" count={sortedItems.length}>
            {sortedItems.map((item) => (
              <FavoriteItemRow key={item.id} item={item} />
            ))}
          </FavoritesSection>
        )}

        {sortedCollections.length > 0 && (
          <FavoritesSection title="Collections" count={sortedCollections.length}>
            {sortedCollections.map((collection) => (
              <FavoriteCollectionRow key={collection.id} collection={collection} />
            ))}
          </FavoritesSection>
        )}
      </div>
    </div>
  );
}
