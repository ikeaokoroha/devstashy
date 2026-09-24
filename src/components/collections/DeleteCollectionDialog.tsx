"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { deleteCollection } from "@/actions/collections";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

const DELETE_ERROR = "Couldn't delete this collection. Please try again.";

interface DeleteCollectionDialogProps {
  collectionId: string;
  name: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Where the caller goes once the row is gone: a refresh from a card, a
  // redirect from the collection's own page.
  onDeleted: () => void;
}

// Controlled and trigger-less for the same reason as EditCollectionDialog. On
// failure the dialog stays open so the user can retry or cancel.
export function DeleteCollectionDialog({
  collectionId,
  name,
  open,
  onOpenChange,
  onDeleted,
}: DeleteCollectionDialogProps) {
  const [isDeleting, startDeleting] = useTransition();

  function handleOpenChange(nextOpen: boolean) {
    // Escape or an outside click can't dismiss the dialog mid-delete.
    if (!isDeleting) {
      onOpenChange(nextOpen);
    }
  }

  function handleDelete() {
    startDeleting(async () => {
      try {
        const result = await deleteCollection(collectionId);
        if (!result.success) {
          toast.error(result.error ?? DELETE_ERROR);
          return;
        }
        toast.success("Collection deleted");
        onOpenChange(false);
        onDeleted();
      } catch {
        toast.error(DELETE_ERROR);
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="wrap-break-word">
            Delete &ldquo;{name}&rdquo;?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This deletes the collection itself. The items in it are kept — they just
            won&rsquo;t belong to this collection any more. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <Button variant="destructive" disabled={isDeleting} onClick={handleDelete}>
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
