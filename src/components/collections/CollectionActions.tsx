"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Star, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DeleteCollectionDialog } from "./DeleteCollectionDialog";
import { EditCollectionDialog, type EditableCollection } from "./EditCollectionDialog";

interface CollectionActionsProps {
  collection: EditableCollection;
  isFavorite: boolean;
}

// The /collections/[id] header's actions. Edit and Delete work; Favorite is
// display only for now, like the item drawer's.
export function CollectionActions({ collection, isFavorite }: CollectionActionsProps) {
  const router = useRouter();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  function handleDeleted() {
    // The page this sits on is gone, so there's nothing to refresh back into.
    router.push("/collections");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="sm" aria-pressed={isFavorite}>
        <Star className={cn(isFavorite && "fill-yellow-400 text-yellow-400")} />
        <span className={cn(isFavorite && "text-yellow-400")}>Favorite</span>
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setIsEditOpen(true)}>
        <Pencil />
        Edit
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="text-destructive hover:text-destructive"
        onClick={() => setIsDeleteOpen(true)}
      >
        <Trash2 />
        Delete
      </Button>

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
        onDeleted={handleDeleted}
      />
    </div>
  );
}
