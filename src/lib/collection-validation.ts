import { z } from "zod";

// Blank optional fields are stored as null rather than empty strings, as in
// item-validation.ts.
const optionalText = z
  .string()
  .trim()
  .nullish()
  .transform((value) => value || null);

export const createCollectionSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: optionalText,
});

export type CreateCollectionInput = z.input<typeof createCollectionSchema>;
export type CreateCollectionData = z.output<typeof createCollectionSchema>;
export type CreateCollectionField = keyof CreateCollectionInput;
