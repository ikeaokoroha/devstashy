import Link from "next/link";
import type { CollectionSummary } from "@/types/dashboard";
import { CollectionCard } from "./CollectionCard";

interface RecentCollectionsProps {
  collections: CollectionSummary[];
}

export function RecentCollections({ collections }: RecentCollectionsProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Recent Collections</h2>
        <Link
          href="/collections"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          View all
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {collections.map((collection) => (
          <CollectionCard key={collection.id} collection={collection} />
        ))}
      </div>
    </section>
  );
}
