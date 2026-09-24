"use server";

import { fieldErrorResult } from "@/lib/action-errors";
import {
  createCollectionSchema,
  type CreateCollectionField,
  type CreateCollectionInput,
} from "@/lib/collection-validation";
import { createCollection as createCollectionQuery } from "@/lib/db/collections";
import { requireUserId } from "@/lib/session";
import type { ActionResult } from "@/types/actions";

interface CreateCollectionResult {
  id?: string;
  fieldErrors?: Partial<Record<CreateCollectionField, string>>;
}

// Saves the New Collection dialog for the signed-in user.
export async function createCollection(
  data: CreateCollectionInput
): Promise<ActionResult<CreateCollectionResult>> {
  const userId = await requireUserId();

  const parsed = createCollectionSchema.safeParse(data);
  if (!parsed.success) {
    return fieldErrorResult<CreateCollectionField>(parsed.error);
  }

  try {
    const id = await createCollectionQuery(userId, parsed.data);
    return { success: true, data: { id } };
  } catch (error) {
    console.error("Failed to create collection", error);
    return { success: false, error: "Couldn't create this collection. Please try again." };
  }
}
