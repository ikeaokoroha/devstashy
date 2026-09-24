import { CollectionCard } from "@/components/dashboard/CollectionCard";
import type { CollectionSummary } from "@/types/dashboard";

interface CollectionGridProps {
  collections: CollectionSummary[];
  emptyMessage: string;
}

export function CollectionGrid({ collections, emptyMessage }: CollectionGridProps) {
  if (collections.length === 0) {
    return (
      <p className="rounded-lg border border-dashed px-6 py-12 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {collections.map((collection) => (
        <CollectionCard key={collection.id} collection={collection} />
      ))}
    </div>
  );
}
