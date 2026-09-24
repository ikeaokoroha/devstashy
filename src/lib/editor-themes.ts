import { EDITOR_THEMES } from "@/lib/editor-preferences";
import type { EditorTheme } from "@/types/editor";

// The shape monaco.editor.defineTheme takes, kept local so this module doesn't
// depend on the monaco-editor package (a dev dependency, for types only).
interface ThemeRule {
  token: string;
  // Monaco wants rule colours without the leading "#", unlike the colours map.
  foreground?: string;
  fontStyle?: string;
}

export interface EditorThemeDefinition {
  base: "vs-dark";
  inherit: true;
  rules: ThemeRule[];
  colors: Record<string, string>;
}

// Monaco only ships vs, vs-dark and hc-black, so monokai and github-dark are
// defined here. All three are registered under a devstash- prefix.
const THEME_NAME_PREFIX = "devstash-";

export function getMonacoThemeName(theme: EditorTheme): string {
  return `${THEME_NAME_PREFIX}${theme}`;
}

// Every theme keeps a transparent editor and gutter so the window frame's
// bg-muted/40 shows through, and the app's own faint-white scrollbar.
const FRAME_COLORS: Record<string, string> = {
  "editor.background": "#00000000",
  "editorGutter.background": "#00000000",
  "minimap.background": "#00000000",
  "editor.lineHighlightBackground": "#ffffff08",
  "editor.lineHighlightBorder": "#00000000",
  "editorLineNumber.foreground": "#ffffff40",
  "editorLineNumber.activeForeground": "#ffffff99",
  "scrollbar.shadow": "#00000000",
  "scrollbarSlider.background": "#ffffff1a",
  "scrollbarSlider.hoverBackground": "#ffffff33",
  "scrollbarSlider.activeBackground": "#ffffff4d",
};

export const EDITOR_THEME_DEFINITIONS: Record<EditorTheme, EditorThemeDefinition> = {
  // Monaco's own dark colours, inherited: only the frame is overridden.
  "vs-dark": {
    base: "vs-dark",
    inherit: true,
    rules: [],
    colors: FRAME_COLORS,
  },
  monokai: {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "", foreground: "f8f8f2" },
      { token: "comment", foreground: "75715e", fontStyle: "italic" },
      { token: "string", foreground: "e6db74" },
      { token: "number", foreground: "ae81ff" },
      { token: "constant", foreground: "ae81ff" },
      { token: "regexp", foreground: "e6db74" },
      { token: "keyword", foreground: "f92672" },
      { token: "operator", foreground: "f92672" },
      { token: "delimiter", foreground: "f8f8f2" },
      { token: "type", foreground: "66d9ef", fontStyle: "italic" },
      { token: "type.identifier", foreground: "a6e22e" },
      { token: "identifier", foreground: "f8f8f2" },
      { token: "variable", foreground: "f8f8f2" },
      { token: "variable.predefined", foreground: "66d9ef" },
      { token: "function", foreground: "a6e22e" },
      { token: "tag", foreground: "f92672" },
      { token: "attribute.name", foreground: "a6e22e" },
      { token: "attribute.value", foreground: "e6db74" },
      { token: "metatag", foreground: "75715e" },
    ],
    colors: {
      ...FRAME_COLORS,
      "editor.foreground": "#f8f8f2",
      "editorCursor.foreground": "#f8f8f0",
      "editor.selectionBackground": "#49483e",
      "editorWhitespace.foreground": "#3b3a32",
    },
  },
  "github-dark": {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "", foreground: "c9d1d9" },
      { token: "comment", foreground: "8b949e" },
      { token: "string", foreground: "a5d6ff" },
      { token: "number", foreground: "79c0ff" },
      { token: "constant", foreground: "79c0ff" },
      { token: "regexp", foreground: "7ee787" },
      { token: "keyword", foreground: "ff7b72" },
      { token: "operator", foreground: "ff7b72" },
      { token: "delimiter", foreground: "c9d1d9" },
      { token: "type", foreground: "ffa657" },
      { token: "type.identifier", foreground: "ffa657" },
      { token: "identifier", foreground: "c9d1d9" },
      { token: "variable", foreground: "c9d1d9" },
      { token: "variable.predefined", foreground: "79c0ff" },
      { token: "function", foreground: "d2a8ff" },
      { token: "tag", foreground: "7ee787" },
      { token: "attribute.name", foreground: "79c0ff" },
      { token: "attribute.value", foreground: "a5d6ff" },
      { token: "metatag", foreground: "8b949e" },
    ],
    colors: {
      ...FRAME_COLORS,
      "editor.foreground": "#c9d1d9",
      "editorCursor.foreground": "#58a6ff",
      "editor.selectionBackground": "#264f78",
      "editorWhitespace.foreground": "#484f58",
    },
  },
};

// Every option in the dropdown has a definition, so a stored theme always resolves.
export const EDITOR_THEME_DEFINITION_LIST = EDITOR_THEMES.map((theme) => ({
  name: getMonacoThemeName(theme),
  definition: EDITOR_THEME_DEFINITIONS[theme],
}));
