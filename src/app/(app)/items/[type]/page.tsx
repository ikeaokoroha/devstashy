import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FileList } from "@/components/items/FileList";
import { ImageGrid } from "@/components/items/ImageGrid";
import { ItemGrid } from "@/components/items/ItemGrid";
import { NewItemDialog } from "@/components/items/NewItemDialog";
import { getItemsByType } from "@/lib/db/items";
import { isCreatableItemType } from "@/lib/item-validation";
import { requireUserId } from "@/lib/session";
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

export default async function ItemsByTypePage({ params }: PageProps<"/items/[type]">) {
  const { type } = await params;
  const typeName = getItemTypeNameFromSlug(type);
  if (!typeName) {
    notFound();
  }

  const userId = await requireUserId();
  const items = await getItemsByType(userId, typeName);
  const { icon: Icon, textClass, bgClass } = getItemTypeStyle(typeName);
  const label = capitalize(getItemTypeSlug(typeName));
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
              {items.length} {items.length === 1 ? "item" : "items"}
            </p>
          </div>
        </div>
        {isCreatableItemType(typeName) && (
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
    </div>
  );
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
