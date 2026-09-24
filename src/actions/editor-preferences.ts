"use server";

import { fieldErrorResult } from "@/lib/action-errors";
import { updateEditorPreferences } from "@/lib/db/users";
import {
  editorPreferencesSchema,
  type EditorPreferencesField,
  type EditorPreferencesInput,
} from "@/lib/editor-preferences";
import { requireUserId } from "@/lib/session";
import type { ActionResult } from "@/types/actions";
import type { EditorPreferences } from "@/types/editor";

interface SaveEditorPreferencesResult {
  preferences?: EditorPreferences;
  fieldErrors?: Partial<Record<EditorPreferencesField, string>>;
}

// Saves the whole preferences object, not a single field: the settings card
// auto-saves on every change and always holds the complete set, so a write can't
// leave the column half updated.
export async function saveEditorPreferences(
  data: EditorPreferencesInput
): Promise<ActionResult<SaveEditorPreferencesResult>> {
  const userId = await requireUserId();

  const parsed = editorPreferencesSchema.safeParse(data);
  if (!parsed.success) {
    return fieldErrorResult<EditorPreferencesField>(parsed.error);
  }

  try {
    const saved = await updateEditorPreferences(userId, parsed.data);
    if (!saved) {
      return { success: false, error: "Couldn't find your account." };
    }
    // Returned so the caller stores what the database now holds rather than what
    // it sent, which is the value the editors then render.
    return { success: true, data: { preferences: parsed.data } };
  } catch (error) {
    console.error("Failed to save editor preferences", error);
    return { success: false, error: "Couldn't save your editor settings. Please try again." };
  }
}
