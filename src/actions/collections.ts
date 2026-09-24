"use server";

import { z } from "zod";

import { fieldErrorResult } from "@/lib/action-errors";
import {
  createCollectionSchema,
  updateCollectionSchema,
  type CreateCollectionField,
  type CreateCollectionInput,
  type UpdateCollectionField,
  type UpdateCollectionInput,
} from "@/lib/collection-validation";
import {
  createCollection as createCollectionQuery,
  deleteCollection as deleteCollectionQuery,
  updateCollection as updateCollectionQuery,
} from "@/lib/db/collections";
import { requireUserId } from "@/lib/session";
import type { ActionResult } from "@/types/actions";

const collectionIdSchema = z.string().min(1);

const NOT_FOUND = "Collection not found.";

interface CreateCollectionResult {
  id?: string;
  fieldErrors?: Partial<Record<CreateCollectionField, string>>;
}

interface UpdateCollectionResult {
  fieldErrors?: Partial<Record<UpdateCollectionField, string>>;
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

// Saves the edit dialog's name and description.
export async function updateCollection(
  collectionId: string,
  data: UpdateCollectionInput
): Promise<ActionResult<UpdateCollectionResult>> {
  const userId = await requireUserId();

  const parsedId = collectionIdSchema.safeParse(collectionId);
  const parsed = updateCollectionSchema.safeParse(data);
  if (!parsedId.success) {
    return { success: false, error: NOT_FOUND };
  }
  if (!parsed.success) {
    return fieldErrorResult<UpdateCollectionField>(parsed.error);
  }

  try {
    const updated = await updateCollectionQuery(userId, parsedId.data, parsed.data);
    if (!updated) {
      return { success: false, error: NOT_FOUND };
    }
    return { success: true };
  } catch (error) {
    console.error("Failed to update collection", error);
    return { success: false, error: "Couldn't save this collection. Please try again." };
  }
}

// Deletes the collection itself. Its items are left alone — they simply stop
// belonging to it.
export async function deleteCollection(collectionId: string): Promise<ActionResult> {
  const userId = await requireUserId();

  const parsedId = collectionIdSchema.safeParse(collectionId);
  if (!parsedId.success) {
    return { success: false, error: NOT_FOUND };
  }

  try {
    const deleted = await deleteCollectionQuery(userId, parsedId.data);
    if (!deleted) {
      return { success: false, error: NOT_FOUND };
    }
    return { success: true };
  } catch (error) {
    console.error("Failed to delete collection", error);
    return { success: false, error: "Couldn't delete this collection. Please try again." };
  }
}
