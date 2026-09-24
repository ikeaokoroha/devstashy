import type { Metadata } from "next";
import { Library } from "lucide-react";

import { CollectionGrid } from "@/components/collections/CollectionGrid";
import { NewCollectionDialog } from "@/components/collections/NewCollectionDialog";
import { getAllCollections } from "@/lib/db/collections";
import { requireUserId } from "@/lib/session";

export const metadata: Metadata = { title: "Collections · Devstashy" };

export default async function CollectionsPage() {
  const userId = await requireUserId();
  const collections = await getAllCollections(userId);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
            <Library className="size-5 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Collections</h1>
            <p className="text-muted-foreground">
              {collections.length}{" "}
              {collections.length === 1 ? "collection" : "collections"}
            </p>
          </div>
        </div>
        <NewCollectionDialog size="default" />
      </div>

      <CollectionGrid
        collections={collections}
        emptyMessage="No collections yet. Create one to group related items."
      />
    </div>
  );
}
