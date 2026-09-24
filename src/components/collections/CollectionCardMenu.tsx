"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Star, Trash2 } from "lucide-react";

import { toggleCollectionFavorite } from "@/actions/collections";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToggleFlag } from "@/hooks/use-toggle-flag";
import { cn } from "@/lib/utils";
import { DeleteCollectionDialog } from "./DeleteCollectionDialog";
import { EditCollectionDialog, type EditableCollection } from "./EditCollectionDialog";

interface CollectionCardMenuProps {
  collection: EditableCollection;
  isFavorite: boolean;
}

// A collection card's three-dot menu. It sits above the card's overlay link with
// relative z-10, so opening the menu doesn't navigate to the collection; both
// dialogs are siblings of the menu rather than children, since a dialog inside
// it would unmount the moment the menu closed.
export function CollectionCardMenu({ collection, isFavorite }: CollectionCardMenuProps) {
  const router = useRouter();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  // The hook lives here rather than in a FavoriteButton, since the menu entry is
  // a DropdownMenuItem and not a button of its own.
  const favorite = useToggleFlag({
    value: isFavorite,
    save: (next) => toggleCollectionFavorite(collection.id, next),
    errorMessage: "Couldn't update this collection. Please try again.",
  });

  return (
    <div className="relative z-10">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Actions for ${collection.name}`}
              className="text-muted-foreground"
            />
          }
        >
          <MoreHorizontal />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
            <Pencil />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem aria-pressed={favorite.value} onClick={favorite.toggle}>
            <Star
              className={cn(favorite.value && "fill-yellow-400 text-yellow-400")}
            />
            {favorite.value ? "Unfavorite" : "Favorite"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => setIsDeleteOpen(true)}
          >
            <Trash2 className="text-destructive" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditCollectionDialog
        collection={collection}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />
      <DeleteCollectionDialog
        collectionId={collection.id}
        name={collection.name}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onDeleted={() => router.refresh()}
      />
    </div>
  );
}
