import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Library } from "lucide-react";

import { CollectionGrid } from "@/components/collections/CollectionGrid";
import { NewCollectionDialog } from "@/components/collections/NewCollectionDialog";
import { PaginationControls } from "@/components/shared/PaginationControls";
import { getAllCollections } from "@/lib/db/collections";
import {
  getPageCount,
  isPageOutOfRange,
  parsePageParam,
  COLLECTIONS_PER_PAGE,
} from "@/lib/pagination";
import { requireUserId } from "@/lib/session";

export const metadata: Metadata = { title: "Collections · Devstashy" };

export default async function CollectionsPage({ searchParams }: PageProps<"/collections">) {
  const { page: pageParam } = await searchParams;
  const page = parsePageParam(pageParam);

  const userId = await requireUserId();
  const { rows: collections, total } = await getAllCollections(userId, page);

  const pageCount = getPageCount(total, COLLECTIONS_PER_PAGE);
  if (isPageOutOfRange(page, pageCount)) {
    notFound();
  }

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
              {total} {total === 1 ? "collection" : "collections"}
            </p>
          </div>
        </div>
        <NewCollectionDialog size="default" />
      </div>

      <CollectionGrid
        collections={collections}
        emptyMessage="No collections yet. Create one to group related items."
      />

      <PaginationControls page={page} pageCount={pageCount} basePath="/collections" />
    </div>
  );
}
