"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteItem } from "@/actions/items";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

const DELETE_ERROR = "Couldn't delete this item. Please try again.";

interface DeleteItemDialogProps {
  itemId: string;
  title: string;
  onDeleted: () => void;
}

// The drawer's Delete button and its confirmation. On failure the dialog stays
// open so the user can retry or cancel.
export function DeleteItemDialog({ itemId, title, onDeleted }: DeleteItemDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isDeleting, startDeleting] = useTransition();

  function handleOpenChange(nextOpen: boolean) {
    // Escape or an outside click can't dismiss the dialog mid-delete.
    if (!isDeleting) {
      setOpen(nextOpen);
    }
  }

  function handleDelete() {
    startDeleting(async () => {
      try {
        const result = await deleteItem(itemId);
        if (!result.success) {
          toast.error(result.error ?? DELETE_ERROR);
          return;
        }
        toast.success("Item deleted");
        setOpen(false);
        onDeleted();
        router.refresh();
      } catch {
        toast.error(DELETE_ERROR);
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Delete"
            className="text-destructive hover:text-destructive"
          />
        }
      >
        <Trash2 />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="wrap-break-word">Delete &ldquo;{title}&rdquo;?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes the item and removes it from any collections it
            belongs to. This cannot be undone.
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
