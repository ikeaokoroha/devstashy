import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Folder, Star } from "lucide-react";

import { CollectionItems } from "@/components/collections/CollectionItems";
import { getCollectionDetail } from "@/lib/db/collections";
import { getItemsByCollection } from "@/lib/db/items";
import { requireUserId } from "@/lib/session";

// generateMetadata and the page both need the row, so one lookup serves both,
// the way requireUserId shares its session across the layout and the page.
const getCollection = cache(getCollectionDetail);

export async function generateMetadata({
  params,
}: PageProps<"/collections/[id]">): Promise<Metadata> {
  const { id } = await params;
  const userId = await requireUserId();
  const collection = await getCollection(userId, id);

  return { title: collection ? `${collection.name} · Devstashy` : "Devstashy" };
}

export default async function CollectionPage({ params }: PageProps<"/collections/[id]">) {
  const { id } = await params;
  const userId = await requireUserId();

  // Both queries are scoped to the user, so the items one can run before the
  // collection is known to exist: a foreign or unknown id finds nothing either
  // way. The cost is one wasted query on the 404 path, against a saved Neon
  // round trip on every real page view.
  const [collection, items] = await Promise.all([
    getCollection(userId, id),
    getItemsByCollection(userId, id),
  ]);

  if (!collection) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Folder className="size-5 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-2xl font-semibold">{collection.name}</h1>
            {collection.isFavorite && (
              <Star
                aria-label="Favorite"
                className="size-5 shrink-0 fill-yellow-400 text-yellow-400"
              />
            )}
          </div>
          <p className="text-muted-foreground">
            {items.length} {items.length === 1 ? "item" : "items"}
          </p>
          {collection.description && (
            <p className="mt-2 text-sm text-muted-foreground">{collection.description}</p>
          )}
        </div>
      </div>

      <CollectionItems
        items={items}
        emptyMessage="No items in this collection yet. Add one from an item's Collections field."
      />
    </div>
  );
}
