import type {
  EDITOR_FONT_SIZES,
  EDITOR_TAB_SIZES,
  EDITOR_THEMES,
} from "@/lib/editor-preferences";

export type EditorFontSize = (typeof EDITOR_FONT_SIZES)[number];
export type EditorTabSize = (typeof EDITOR_TAB_SIZES)[number];
export type EditorTheme = (typeof EDITOR_THEMES)[number];

// The Monaco settings a user can change, stored as the User.editorPreferences
// JSON column. Always complete: a null or partial column reads as the defaults.
export interface EditorPreferences {
  fontSize: EditorFontSize;
  tabSize: EditorTabSize;
  wordWrap: boolean;
  minimap: boolean;
  theme: EditorTheme;
}
