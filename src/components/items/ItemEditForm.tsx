"use client";

import { useState, useTransition } from "react";
import type { SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { toast } from "sonner";

import { updateItem } from "@/actions/items";
import { FormField } from "@/components/auth/FormField";
import { Button } from "@/components/ui/button";
import { toItemDetailJson } from "@/lib/item-detail";
import { getEditableFields, parseTags, type UpdateItemField } from "@/lib/item-validation";
import type { ItemDetailJson } from "@/types/items";
import { CollectionPicker } from "./CollectionPicker";
import { ContentField } from "./ContentField";
import { ItemMetadata } from "./ItemDetailBody";
import { TextareaField } from "./TextareaField";

const SAVE_ERROR = "Couldn't save your changes. Please try again.";

type FieldErrors = Partial<Record<UpdateItemField, string>>;

interface ItemEditFormProps {
  item: ItemDetailJson;
  typeName: string;
  onCancel: () => void;
  onSaved: (item: ItemDetailJson) => void;
}

// The drawer in edit mode: Save and Cancel replace the action bar, and the body
// becomes controlled inputs. Mounted fresh on each edit, so Cancel just unmounts it.
export function ItemEditForm({ item, typeName, onCancel, onSaved }: ItemEditFormProps) {
  const router = useRouter();
  const editable = getEditableFields(typeName);
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description ?? "");
  const [content, setContent] = useState(item.content ?? "");
  const [language, setLanguage] = useState(item.language ?? "");
  const [url, setUrl] = useState(item.url ?? "");
  const [tags, setTags] = useState(item.tags.join(", "));
  const [collectionIds, setCollectionIds] = useState(
    item.collections.map((collection) => collection.id)
  );
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSaving, startSaving] = useTransition();

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    startSaving(async () => {
      try {
        const result = await updateItem(item.id, {
          title,
          description,
          content: editable.content ? content : null,
          language: editable.language ? language : null,
          url: editable.url ? url : null,
          tags: parseTags(tags),
          collectionIds,
        });
        if (!result.success || !result.data?.item) {
          setFieldErrors(result.data?.fieldErrors ?? {});
          toast.error(result.error ?? SAVE_ERROR);
          return;
        }
        toast.success("Item saved");
        onSaved(toItemDetailJson(result.data.item));
        router.refresh();
      } catch {
        toast.error(SAVE_ERROR);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="contents" noValidate>
      <div className="flex items-center justify-end gap-2 border-b px-6 pb-4">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={isSaving}>
          <X />
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={isSaving || !title.trim()}>
          <Check />
          {isSaving ? "Saving…" : "Save"}
        </Button>
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-6">
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
        {editable.content && (
          <ContentField
            typeName={typeName}
            value={content}
            onChange={setContent}
            language={language}
            error={fieldErrors.content}
            textareaClassName="max-h-96 min-h-40 font-mono text-xs leading-relaxed md:text-xs"
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
        <CollectionPicker
          value={collectionIds}
          onChange={setCollectionIds}
          error={fieldErrors.collectionIds}
        />

        <ItemMetadata item={item} showCollections={false} />
      </div>
    </form>
  );
}
