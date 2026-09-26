import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FileList } from "@/components/items/FileList";
import { ImageGrid } from "@/components/items/ImageGrid";
import { ItemGrid } from "@/components/items/ItemGrid";
import { NewItemDialog } from "@/components/items/NewItemDialog";
import { PaginationControls } from "@/components/shared/PaginationControls";
import { getItemsByType } from "@/lib/db/items";
import { isCreatableItemType } from "@/lib/item-validation";
import {
  getPageCount,
  isPageOutOfRange,
  parsePageParam,
  ITEMS_PER_PAGE,
} from "@/lib/pagination";
import { requireSessionUser } from "@/lib/session";
import { canUseItemType } from "@/lib/usage-limits";
import { cn } from "@/lib/utils";
import {
  getItemTypeNameFromSlug,
  getItemTypeSlug,
  getItemTypeStyle,
} from "@/lib/item-types";

export async function generateMetadata({
  params,
}: PageProps<"/items/[type]">): Promise<Metadata> {
  const { type } = await params;
  const typeName = getItemTypeNameFromSlug(type);
  return { title: typeName ? `${capitalize(type)} · Devstashy` : "Devstashy" };
}

export default async function ItemsByTypePage({
  params,
  searchParams,
}: PageProps<"/items/[type]">) {
  const [{ type }, { page: pageParam }] = await Promise.all([params, searchParams]);
  const typeName = getItemTypeNameFromSlug(type);
  if (!typeName) {
    notFound();
  }

  const page = parsePageParam(pageParam);
  const { id: userId, isPro } = await requireSessionUser();
  const { rows: items, total } = await getItemsByType(userId, typeName, page);

  const pageCount = getPageCount(total, ITEMS_PER_PAGE);
  if (isPageOutOfRange(page, pageCount)) {
    notFound();
  }

  const { icon: Icon, textClass, bgClass } = getItemTypeStyle(typeName);
  const slug = getItemTypeSlug(typeName);
  const label = capitalize(slug);
  const emptyMessage = `No ${label.toLowerCase()} yet.`;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={cn("flex size-10 items-center justify-center rounded-lg", bgClass)}
          >
            <Icon className={cn("size-5", textClass)} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">{label}</h1>
            <p className="text-muted-foreground">
              {total} {total === 1 ? "item" : "items"}
            </p>
          </div>
        </div>
        {isCreatableItemType(typeName) && canUseItemType(isPro, typeName) && (
          <NewItemDialog
            defaultType={typeName}
            label={`New ${capitalize(typeName)}`}
            size="default"
          />
        )}
      </div>

      {/* Images get thumbnail tiles and files a Drive-style list; every other
          type keeps the card rows. */}
      {typeName === "image" ? (
        <ImageGrid items={items} emptyMessage={emptyMessage} leading />
      ) : typeName === "file" ? (
        <FileList items={items} emptyMessage={emptyMessage} />
      ) : (
        <ItemGrid items={items} emptyMessage={emptyMessage} />
      )}

      <PaginationControls page={page} pageCount={pageCount} basePath={`/items/${slug}`} />
    </div>
  );
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
