"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { getCopyText } from "@/lib/item-detail";
import { getItemTypeStyle } from "@/lib/item-types";
import { cn } from "@/lib/utils";
import type { ItemWithType } from "@/types/dashboard";
import type { ItemDetailJson, ItemDetailState } from "@/types/items";
import { ItemDetailBody, ItemDetailSkeleton } from "./ItemDetailBody";
import { ItemDrawerActions } from "./ItemDrawerActions";
import { ItemEditForm } from "./ItemEditForm";

interface ItemDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // The clicked card's data, so the header renders before the detail arrives.
  preview: ItemWithType | null;
  detail: ItemDetailState;
  onRetry: () => void;
  editing: boolean;
  onEditingChange: (editing: boolean) => void;
  onSaved: (item: ItemDetailJson) => void;
}

export function ItemDrawer({
  open,
  onOpenChange,
  preview,
  detail,
  onRetry,
  editing,
  onEditingChange,
  onSaved,
}: ItemDrawerProps) {
  const item = detail.status === "loaded" ? detail.item : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 data-[side=right]:sm:max-w-xl">
        {preview && (
          <>
            <ItemDrawerHeader
              preview={preview}
              // Prefer the loaded item so a saved title or language shows straight away.
              title={item?.title ?? preview.title}
              language={item?.language ?? null}
            />
            {editing && item ? (
              <ItemEditForm
                item={item}
                typeName={item.itemType.name}
                onCancel={() => onEditingChange(false)}
                onSaved={onSaved}
              />
            ) : (
              <>
                <div className="border-b px-6 pb-4">
                  <ItemDrawerActions
                    // Remount per item so the copy feedback doesn't carry over.
                    key={preview.id}
                    itemId={preview.id}
                    title={item?.title ?? preview.title}
                    isFavorite={item?.isFavorite ?? preview.isFavorite}
                    isPinned={item?.isPinned ?? preview.isPinned}
                    copyText={item ? getCopyText(item) : null}
                    onEdit={item ? () => onEditingChange(true) : null}
                    onDeleted={() => onOpenChange(false)}
                  />
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
                  {detail.status === "loading" && <ItemDetailSkeleton />}
                  {detail.status === "loaded" && <ItemDetailBody item={detail.item} />}
                  {detail.status === "error" && (
                    <div className="space-y-3 text-center">
                      <p className="text-muted-foreground">{detail.error}</p>
                      <Button variant="outline" size="sm" onClick={onRetry}>
                        Try again
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

interface ItemDrawerHeaderProps {
  preview: ItemWithType;
  title: string;
  language: string | null;
}

function ItemDrawerHeader({ preview, title, language }: ItemDrawerHeaderProps) {
  const { icon: Icon, textClass, bgClass } = getItemTypeStyle(preview.itemType.name);

  return (
    <SheetHeader className="flex-row items-start gap-4 px-6 pt-6 pr-12">
      <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-lg", bgClass)}>
        <Icon aria-hidden className={cn("size-5", textClass)} />
      </div>
      <div className="min-w-0 space-y-2">
        <SheetTitle className="text-lg font-semibold break-words">{title}</SheetTitle>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary" className="capitalize">
            {preview.itemType.name}
          </Badge>
          {language && <Badge variant="outline">{language}</Badge>}
        </div>
      </div>
    </SheetHeader>
  );
}
