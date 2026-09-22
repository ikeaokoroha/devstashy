import { z } from "zod";

// Which of the type-specific fields an item type can edit. Everything else a
// type doesn't use is left untouched on save.
export interface EditableItemFields {
  content: boolean;
  language: boolean;
  url: boolean;
  file: boolean;
}

const CONTENT_TYPES = new Set(["snippet", "prompt", "command", "note"]);
const LANGUAGE_TYPES = new Set(["snippet", "command"]);
const URL_TYPES = new Set(["link"]);
const FILE_TYPES = new Set(["file", "image"]);

export function getEditableFields(typeName: string): EditableItemFields {
  return {
    content: CONTENT_TYPES.has(typeName),
    language: LANGUAGE_TYPES.has(typeName),
    url: URL_TYPES.has(typeName),
    // Set only at create time: the drawer's edit form can't swap the file out.
    file: FILE_TYPES.has(typeName),
  };
}

// "react, hooks,, react " → ["react", "hooks"]
export function parseTags(value: string): string[] {
  return [...new Set(value.split(",").map((tag) => tag.trim()).filter(Boolean))];
}

// Blank optional fields are stored as null rather than empty strings.
const optionalText = z
  .string()
  .trim()
  .nullish()
  .transform((value) => value || null);

export const updateItemSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: optionalText,
  // Not trimmed: leading indentation is part of a snippet.
  content: z
    .string()
    .nullish()
    .transform((value) => (value?.trim() ? value : null)),
  language: optionalText,
  url: optionalText.pipe(
    z.url({ protocol: /^https?$/, error: "Enter a valid http(s) URL" }).nullable()
  ),
  tags: z
    .array(z.string().trim())
    .transform((tags) => [...new Set(tags.filter(Boolean))]),
});

export type UpdateItemInput = z.input<typeof updateItemSchema>;
export type UpdateItemData = z.output<typeof updateItemSchema>;
export type UpdateItemField = keyof UpdateItemInput;

// System types the New Item dialog offers, in spec order. file and image are
// Pro-only in the plan, but every type is open during development.
export const CREATABLE_ITEM_TYPES = [
  "snippet",
  "prompt",
  "command",
  "note",
  "file",
  "image",
  "link",
] as const;

export type CreatableItemType = (typeof CREATABLE_ITEM_TYPES)[number];

export function isCreatableItemType(typeName: string): typeName is CreatableItemType {
  return (CREATABLE_ITEM_TYPES as readonly string[]).includes(typeName);
}

export const createItemSchema = updateItemSchema
  .extend({
    type: z.enum(CREATABLE_ITEM_TYPES, { error: "Choose an item type" }),
    // Filled in by FileUpload once the browser's PUT to R2 finishes. The URL is
    // only checked for shape here; the action re-checks that it points into our
    // own bucket, since a client could otherwise store any URL it likes.
    fileUrl: optionalText.pipe(
      z.url({ protocol: /^https?$/, error: "Upload a file" }).nullable()
    ),
    fileName: optionalText,
    fileSize: z
      .number()
      .int()
      .positive()
      .nullish()
      .transform((value) => value ?? null),
  })
  .superRefine((data, ctx) => {
    const editable = getEditableFields(data.type);
    if (editable.url && !data.url) {
      ctx.addIssue({ code: "custom", path: ["url"], message: "URL is required" });
    }
    if (editable.file && !(data.fileUrl && data.fileName && data.fileSize)) {
      ctx.addIssue({ code: "custom", path: ["fileUrl"], message: "Upload a file" });
    }
  });

export type CreateItemInput = z.input<typeof createItemSchema>;
export type CreateItemData = z.output<typeof createItemSchema>;
export type CreateItemField = keyof CreateItemInput;
