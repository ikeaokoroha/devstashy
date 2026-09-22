import { z } from "zod";

// Which of the type-specific fields an item type can edit. Everything else a
// type doesn't use is left untouched on save.
export interface EditableItemFields {
  content: boolean;
  language: boolean;
  url: boolean;
}

const CONTENT_TYPES = new Set(["snippet", "prompt", "command", "note"]);
const LANGUAGE_TYPES = new Set(["snippet", "command"]);
const URL_TYPES = new Set(["link"]);

export function getEditableFields(typeName: string): EditableItemFields {
  return {
    content: CONTENT_TYPES.has(typeName),
    language: LANGUAGE_TYPES.has(typeName),
    url: URL_TYPES.has(typeName),
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
