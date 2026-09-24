"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";

import { FavoriteButton } from "@/components/shared/FavoriteButton";
import { Button } from "@/components/ui/button";
import { DeleteCollectionDialog } from "./DeleteCollectionDialog";
import { EditCollectionDialog, type EditableCollection } from "./EditCollectionDialog";

interface CollectionActionsProps {
  collection: EditableCollection;
  isFavorite: boolean;
}

// The /collections/[id] header's actions.
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
      <FavoriteButton
        kind="collection"
        id={collection.id}
        name={collection.name}
        isFavorite={isFavorite}
        showLabel
      />
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
