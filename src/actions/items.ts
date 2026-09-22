"use server";

import { z } from "zod";

import { updateItem as updateItemQuery } from "@/lib/db/items";
import { updateItemSchema, type UpdateItemField, type UpdateItemInput } from "@/lib/item-validation";
import { requireUserId } from "@/lib/session";
import type { ActionResult } from "@/types/actions";
import type { ItemDetail } from "@/types/items";

interface UpdateItemResult {
  item?: ItemDetail;
  fieldErrors?: Partial<Record<UpdateItemField, string>>;
}

const itemIdSchema = z.string().min(1);

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
    const { fieldErrors } = z.flattenError(parsed.error);
    return {
      success: false,
      error: "Please fix the highlighted fields.",
      data: {
        fieldErrors: Object.fromEntries(
          Object.entries(fieldErrors).map(([field, messages]) => [field, messages?.[0]])
        ),
      },
    };
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
