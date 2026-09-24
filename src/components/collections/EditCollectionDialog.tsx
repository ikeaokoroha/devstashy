"use client";

import { useState, useTransition } from "react";
import type { SubmitEvent, TransitionStartFunction } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { updateCollection } from "@/actions/collections";
import { FormField } from "@/components/auth/FormField";
import { TextareaField } from "@/components/items/TextareaField";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { UpdateCollectionField } from "@/lib/collection-validation";

const SAVE_ERROR = "Couldn't save this collection. Please try again.";

type FieldErrors = Partial<Record<UpdateCollectionField, string>>;

// The fields the dialog edits, which both CollectionSummary and CollectionDetail
// already carry, so neither call site needs an extra query to prefill the form.
export interface EditableCollection {
  id: string;
  name: string;
  description: string | null;
}

interface EditCollectionFormProps {
  collection: EditableCollection;
  isSaving: boolean;
  startSaving: TransitionStartFunction;
  onSaved: () => void;
}

// Unmounted whenever the dialog closes, so each open starts from the collection's
// saved values and discards any abandoned edit.
function EditCollectionForm({
  collection,
  isSaving,
  startSaving,
  onSaved,
}: EditCollectionFormProps) {
  const [name, setName] = useState(collection.name);
  const [description, setDescription] = useState(collection.description ?? "");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const canSubmit = !isSaving && name.trim() !== "";

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    startSaving(async () => {
      try {
        const result = await updateCollection(collection.id, { name, description });
        if (!result.success) {
          setFieldErrors(result.data?.fieldErrors ?? {});
          toast.error(result.error ?? SAVE_ERROR);
          return;
        }
        toast.success("Collection updated");
        onSaved();
      } catch {
        toast.error(SAVE_ERROR);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5" noValidate>
      <DialogHeader>
        <DialogTitle>Edit collection</DialogTitle>
        <DialogDescription>Rename this collection or change its description.</DialogDescription>
      </DialogHeader>

      <FormField
        name="collection-name"
        label="Name"
        placeholder="e.g. React Patterns"
        value={name}
        onChange={(event) => setName(event.target.value)}
        error={fieldErrors.name}
        required
        autoFocus
      />
      <TextareaField
        name="collection-description"
        label="Description"
        placeholder="What goes in this collection?"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        error={fieldErrors.description}
        rows={3}
      />

      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" disabled={isSaving} />}>
          Cancel
        </DialogClose>
        <Button type="submit" disabled={!canSubmit}>
          {isSaving ? "Saving…" : "Save"}
        </Button>
      </DialogFooter>
    </form>
  );
}

interface EditCollectionDialogProps {
  collection: EditableCollection;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Controlled and trigger-less, unlike NewCollectionDialog: one caller opens it
// from a header button and the other from a dropdown menu item, and a dialog
// rendered inside the menu would unmount with it.
export function EditCollectionDialog({
  collection,
  open,
  onOpenChange,
}: EditCollectionDialogProps) {
  const router = useRouter();
  const [isSaving, startSaving] = useTransition();

  function handleOpenChange(nextOpen: boolean) {
    // Escape or an outside click can't dismiss the dialog mid-save.
    if (!isSaving) {
      onOpenChange(nextOpen);
    }
  }

  function handleSaved() {
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
        <EditCollectionForm
          collection={collection}
          isSaving={isSaving}
          startSaving={startSaving}
          onSaved={handleSaved}
        />
      </DialogContent>
    </Dialog>
  );
}
