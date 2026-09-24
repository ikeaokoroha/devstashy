import { z } from "zod";

import type { EditorPreferences, EditorTheme } from "@/types/editor";

// The dropdown options. 12 and 2 are what the editor used before preferences
// existed, so an account that never opens settings sees no change.
export const EDITOR_FONT_SIZES = [11, 12, 13, 14, 16, 18] as const;
export const EDITOR_TAB_SIZES = [2, 4, 8] as const;
export const EDITOR_THEMES = ["vs-dark", "monokai", "github-dark"] as const;

export const EDITOR_THEME_LABELS: Record<EditorTheme, string> = {
  "vs-dark": "VS Dark",
  monokai: "Monokai",
  "github-dark": "GitHub Dark",
};

export const DEFAULT_EDITOR_PREFERENCES: EditorPreferences = {
  fontSize: 12,
  tabSize: 2,
  wordWrap: true,
  minimap: false,
  theme: "vs-dark",
};

// What the settings card sends. Strict: an unlisted font size or theme is a
// rejected payload, not a silent fallback. z.literal over the option arrays keeps
// them the single source of truth for both the values and the types.
export const editorPreferencesSchema = z.object({
  fontSize: z.literal(EDITOR_FONT_SIZES),
  tabSize: z.literal(EDITOR_TAB_SIZES),
  wordWrap: z.boolean(),
  minimap: z.boolean(),
  theme: z.enum(EDITOR_THEMES),
});

export type EditorPreferencesInput = z.input<typeof editorPreferencesSchema>;
export type EditorPreferencesField = keyof EditorPreferencesInput;

// Reading the column is lenient where saving is strict: the value comes from a
// JSON column that could be null, partial, or left behind by an older shape, and
// none of that should stop an editor from rendering. Each field falls back on its
// own, so one bad value doesn't discard the rest.
const storedPreferencesSchema = z
  .object({
    fontSize: z.literal(EDITOR_FONT_SIZES).catch(DEFAULT_EDITOR_PREFERENCES.fontSize),
    tabSize: z.literal(EDITOR_TAB_SIZES).catch(DEFAULT_EDITOR_PREFERENCES.tabSize),
    wordWrap: z.boolean().catch(DEFAULT_EDITOR_PREFERENCES.wordWrap),
    minimap: z.boolean().catch(DEFAULT_EDITOR_PREFERENCES.minimap),
    theme: z.enum(EDITOR_THEMES).catch(DEFAULT_EDITOR_PREFERENCES.theme),
  })
  .catch(DEFAULT_EDITOR_PREFERENCES);

export function parseEditorPreferences(value: unknown): EditorPreferences {
  return storedPreferencesSchema.parse(value);
}
