"use client";

import { useState, useTransition } from "react";
import type { SubmitEvent, TransitionStartFunction } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { createItem } from "@/actions/items";
import { FormField } from "@/components/auth/FormField";
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
import { Label } from "@/components/ui/label";
import { isFileItemType } from "@/lib/file-upload";
import { getItemTypeStyle } from "@/lib/item-types";
import {
  CREATABLE_ITEM_TYPES,
  getEditableFields,
  parseTags,
  type CreatableItemType,
  type CreateItemField,
} from "@/lib/item-validation";
import { cn } from "@/lib/utils";
import type { UploadedFile } from "@/types/items";
import { ContentField } from "./ContentField";
import { FileUpload } from "./FileUpload";
import { TextareaField } from "./TextareaField";

const CREATE_ERROR = "Couldn't create this item. Please try again.";

type FieldErrors = Partial<Record<CreateItemField, string>>;

interface TypePickerProps {
  value: CreatableItemType;
  onChange: (type: CreatableItemType) => void;
}

// One toggle button per type, with the type's colored icon as in the sidebar.
function TypePicker({ value, onChange }: TypePickerProps) {
  return (
    <div className="grid gap-2">
      <Label id="new-item-type">Type</Label>
      <div
        role="radiogroup"
        aria-labelledby="new-item-type"
        className="grid grid-cols-3 gap-2 sm:grid-cols-4"
      >
        {CREATABLE_ITEM_TYPES.map((type) => {
          const { icon: Icon, textClass, bgClass } = getItemTypeStyle(type);
          const selected = type === value;
          return (
            <button
              key={type}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(type)}
              className={cn(
                "inline-flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-lg border px-2 text-xs font-medium capitalize transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 [&_svg]:size-3.5 [&_svg]:shrink-0",
                selected
                  ? ["border-current", textClass, bgClass]
                  : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className={textClass} />
              {type}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface NewItemFormProps {
  defaultType: CreatableItemType;
  isSaving: boolean;
  startSaving: TransitionStartFunction;
  onCreated: () => void;
}

// Unmounted whenever the dialog closes, so each open starts with a blank form.
function NewItemForm({ defaultType, isSaving, startSaving, onCreated }: NewItemFormProps) {
  const [type, setType] = useState<CreatableItemType>(defaultType);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [language, setLanguage] = useState("");
  const [url, setUrl] = useState("");
  const [tags, setTags] = useState("");
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const editable = getEditableFields(type);
  const canSubmit =
    !isSaving &&
    !isUploading &&
    title.trim() !== "" &&
    (!editable.url || url.trim() !== "") &&
    (!editable.file || file !== null);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    startSaving(async () => {
      try {
        const result = await createItem({
          type,
          title,
          description,
          content: editable.content ? content : null,
          language: editable.language ? language : null,
          url: editable.url ? url : null,
          fileUrl: editable.file ? (file?.fileUrl ?? null) : null,
          fileName: editable.file ? (file?.fileName ?? null) : null,
          fileSize: editable.file ? (file?.fileSize ?? null) : null,
          tags: parseTags(tags),
        });
        if (!result.success) {
          setFieldErrors(result.data?.fieldErrors ?? {});
          toast.error(result.error ?? CREATE_ERROR);
          return;
        }
        toast.success("Item created");
        onCreated();
      } catch {
        toast.error(CREATE_ERROR);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5" noValidate>
      <DialogHeader>
        <DialogTitle>New item</DialogTitle>
        <DialogDescription>Pick a type, then fill in the details.</DialogDescription>
      </DialogHeader>

      <TypePicker value={type} onChange={setType} />
      <FormField
        name="title"
        label="Title"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        error={fieldErrors.title}
        required
        autoFocus
      />
      <TextareaField
        name="description"
        label="Description"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        error={fieldErrors.description}
        rows={2}
      />
      {editable.file && isFileItemType(type) && (
        <FileUpload
          typeName={type}
          value={file}
          onChange={setFile}
          error={fieldErrors.fileUrl}
          onUploadingChange={setIsUploading}
        />
      )}
      {editable.content && (
        <ContentField
          typeName={type}
          value={content}
          onChange={setContent}
          language={language}
          error={fieldErrors.content}
          textareaClassName="max-h-72 min-h-32 font-mono text-xs leading-relaxed md:text-xs"
        />
      )}
      {editable.language && (
        <FormField
          name="language"
          label="Language"
          placeholder="e.g. typescript"
          value={language}
          onChange={(event) => setLanguage(event.target.value)}
          error={fieldErrors.language}
        />
      )}
      {editable.url && (
        <FormField
          name="url"
          label="URL"
          type="url"
          placeholder="https://"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          error={fieldErrors.url}
          required
        />
      )}
      <FormField
        name="tags"
        label="Tags"
        placeholder="react, hooks, auth"
        value={tags}
        onChange={(event) => setTags(event.target.value)}
        error={fieldErrors.tags}
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

interface NewItemDialogProps {
  // The type selected when the dialog opens; the picker can still change it.
  defaultType?: CreatableItemType;
  label?: string;
  size?: "default" | "lg";
}

// A New Item button and its dialog: the top bar's generic one, or a type page's
// "New Snippet" with that type preselected.
export function NewItemDialog({
  defaultType = "snippet",
  label = "New Item",
  size = "lg",
}: NewItemDialogProps) {
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
      <DialogTrigger render={<Button size={size} />}>
        <Plus />
        {label}
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl">
        <NewItemForm
          defaultType={defaultType}
          isSaving={isSaving}
          startSaving={startSaving}
          onCreated={handleCreated}
        />
      </DialogContent>
    </Dialog>
  );
}
