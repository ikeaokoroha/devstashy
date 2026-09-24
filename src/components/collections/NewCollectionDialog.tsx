"use client";

import { useState, useTransition } from "react";
import type { SubmitEvent, TransitionStartFunction } from "react";
import { useRouter } from "next/navigation";
import { FolderPlus } from "lucide-react";
import { toast } from "sonner";

import { createCollection } from "@/actions/collections";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import type { CreateCollectionField } from "@/lib/collection-validation";

const CREATE_ERROR = "Couldn't create this collection. Please try again.";

type FieldErrors = Partial<Record<CreateCollectionField, string>>;

interface NewCollectionFormProps {
  isSaving: boolean;
  startSaving: TransitionStartFunction;
  onCreated: () => void;
}

// Unmounted whenever the dialog closes, so each open starts with a blank form.
function NewCollectionForm({ isSaving, startSaving, onCreated }: NewCollectionFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const canSubmit = !isSaving && name.trim() !== "";

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    startSaving(async () => {
      try {
        const result = await createCollection({ name, description });
        if (!result.success) {
          setFieldErrors(result.data?.fieldErrors ?? {});
          toast.error(result.error ?? CREATE_ERROR);
          return;
        }
        toast.success("Collection created");
        onCreated();
      } catch {
        toast.error(CREATE_ERROR);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5" noValidate>
      <DialogHeader>
        <DialogTitle>New collection</DialogTitle>
        <DialogDescription>Group related items under one name.</DialogDescription>
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
          {isSaving ? "Creating…" : "Create"}
        </Button>
      </DialogFooter>
    </form>
  );
}

// The top bar's New Collection button and its dialog.
export function NewCollectionDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSaving, startSaving] = useTransition();

  function handleOpenChange(nextOpen: boolean) {
    // Escape or an outside click can't dismiss the dialog mid-save.
    if (!isSaving) {
      setOpen(nextOpen);
    }
  }

  function handleCreated() {
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={<Button variant="outline" size="lg" className="hidden sm:inline-flex" />}
      >
        <FolderPlus />
        New Collection
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
        <NewCollectionForm
          isSaving={isSaving}
          startSaving={startSaving}
          onCreated={handleCreated}
        />
      </DialogContent>
    </Dialog>
  );
}
