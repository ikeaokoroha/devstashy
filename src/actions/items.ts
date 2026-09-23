"use server";

import { z } from "zod";

import {
  createItem as createItemQuery,
  deleteItem as deleteItemQuery,
  updateItem as updateItemQuery,
} from "@/lib/db/items";
import {
  createItemSchema,
  getEditableFields,
  updateItemSchema,
  type CreateItemField,
  type CreateItemInput,
  type UpdateItemField,
  type UpdateItemInput,
} from "@/lib/item-validation";
import { deleteObject, getOwnedObjectKeyFromUrl } from "@/lib/r2";
import { requireUserId } from "@/lib/session";
import type { ActionResult } from "@/types/actions";
import type { ItemDetail } from "@/types/items";

interface UpdateItemResult {
  item?: ItemDetail;
  fieldErrors?: Partial<Record<UpdateItemField, string>>;
}

interface CreateItemResult {
  id?: string;
  fieldErrors?: Partial<Record<CreateItemField, string>>;
}

const itemIdSchema = z.string().min(1);

// The first message for each invalid field, for the form to show inline.
function fieldErrorResult<Field extends string>(
  error: z.ZodError<Record<Field, unknown>>
): ActionResult<{ fieldErrors: Partial<Record<Field, string>> }> {
  const { fieldErrors } = z.flattenError(error);
  return {
    success: false,
    error: "Please fix the highlighted fields.",
    data: {
      fieldErrors: Object.fromEntries(
        Object.entries<string[] | undefined>(fieldErrors).map(([field, messages]) => [
          field,
          messages?.[0],
        ])
      ) as Partial<Record<Field, string>>,
    },
  };
}

// Saves the New Item dialog for the signed-in user.
export async function createItem(data: CreateItemInput): Promise<ActionResult<CreateItemResult>> {
  const userId = await requireUserId();

  const parsed = createItemSchema.safeParse(data);
  if (!parsed.success) {
    return fieldErrorResult<CreateItemField>(parsed.error);
  }

  // The file URL arrives from the browser, so it's only trusted once it's been
  // shown to point at an object under this user's own prefix — otherwise an item
  // could be made to render any URL at all, or to carry another user's object,
  // which deleteItem would later delete from R2 on their behalf.
  if (getEditableFields(parsed.data.type).file) {
    const key = parsed.data.fileUrl
      ? getOwnedObjectKeyFromUrl(parsed.data.fileUrl, userId)
      : null;
    if (!key) {
      return {
        success: false,
        error: "Please fix the highlighted fields.",
        data: { fieldErrors: { fileUrl: "Upload a file" } },
      };
    }
  }

  try {
    const id = await createItemQuery(userId, parsed.data);
    if (!id) {
      return { success: false, error: "That item type isn't available." };
    }
    return { success: true, data: { id } };
  } catch (error) {
    console.error("Failed to create item", error);
    return { success: false, error: "Couldn't create this item. Please try again." };
  }
}

// Saves the item drawer's edit form. Ownership is enforced by the query, which
// only matches the signed-in user's items.
export async function updateItem(
  itemId: string,
  data: UpdateItemInput
): Promise<ActionResult<UpdateItemResult>> {
  const userId = await requireUserId();

  const parsedId = itemIdSchema.safeParse(itemId);
  const parsed = updateItemSchema.safeParse(data);
  if (!parsedId.success) {
    return { success: false, error: "Item not found." };
  }
  if (!parsed.success) {
    return fieldErrorResult<UpdateItemField>(parsed.error);
  }

  try {
    const item = await updateItemQuery(userId, parsedId.data, parsed.data);
    if (!item) {
      return { success: false, error: "Item not found." };
    }
    return { success: true, data: { item } };
  } catch (error) {
    console.error("Failed to update item", error);
    return { success: false, error: "Couldn't save your changes. Please try again." };
  }
}

// Deletes an item from the drawer's confirmation dialog, scoped to the signed-in user.
export async function deleteItem(itemId: string): Promise<ActionResult> {
  const userId = await requireUserId();

  const parsedId = itemIdSchema.safeParse(itemId);
  if (!parsedId.success) {
    return { success: false, error: "Item not found." };
  }

  try {
    const { deleted, fileUrl } = await deleteItemQuery(userId, parsedId.data);
    if (!deleted) {
      return { success: false, error: "Item not found." };
    }

    // After the row is gone, so a storage outage can't block the delete. A
    // failure here only leaves an orphaned object, which deleteObject logs.
    // The owner check is repeated here because a row written before createItem
    // enforced it could still hold someone else's key; the object is then left
    // in place rather than deleted.
    const key = fileUrl ? getOwnedObjectKeyFromUrl(fileUrl, userId) : null;
    if (key) {
      await deleteObject(key);
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to delete item", error);
    return { success: false, error: "Couldn't delete this item. Please try again." };
  }
}
