// Item types whose content is code and gets the Monaco editor instead of a textarea.
const CODE_TYPES = new Set(["snippet", "command"]);

export const EDITOR_MAX_HEIGHT = 400;
export const EDITOR_PADDING = 12;
// Line height follows the font size preference rather than being fixed: at 18px a
// fixed 18px line clips the text, and at 11px it leaves a gap.
export const EDITOR_LINE_HEIGHT_RATIO = 1.5;
// Editing starts with room to type; a read-only one-liner stays one line tall.
export const EDITOR_MIN_HEIGHT = { edit: 120, readOnly: 0 };

// Short names people type in the language field, mapped to Monaco's language ids.
const LANGUAGE_ALIASES: Record<string, string> = {
  ts: "typescript",
  tsx: "typescript",
  js: "javascript",
  jsx: "javascript",
  py: "python",
  rb: "ruby",
  rs: "rust",
  golang: "go",
  sh: "shell",
  bash: "shell",
  zsh: "shell",
  terminal: "shell",
  ps: "powershell",
  ps1: "powershell",
  yml: "yaml",
  md: "markdown",
  "c#": "csharp",
  cs: "csharp",
  "c++": "cpp",
  kt: "kotlin",
  docker: "dockerfile",
  psql: "sql",
  postgres: "sql",
  postgresql: "sql",
  html: "html",
  htm: "html",
};

// Languages Monaco highlights under their own name.
const MONACO_LANGUAGES = new Set([
  "typescript",
  "javascript",
  "python",
  "ruby",
  "rust",
  "go",
  "shell",
  "powershell",
  "yaml",
  "json",
  "markdown",
  "csharp",
  "cpp",
  "c",
  "java",
  "kotlin",
  "swift",
  "php",
  "sql",
  "html",
  "css",
  "scss",
  "less",
  "xml",
  "dockerfile",
  "graphql",
  "ini",
  "lua",
  "r",
  "dart",
  "scala",
  "perl",
  "elixir",
  "clojure",
]);

export function isCodeType(typeName: string): boolean {
  return CODE_TYPES.has(typeName);
}

// "TS" → "typescript". Commands without a language are highlighted as shell;
// anything Monaco doesn't know falls back to plain text.
export function getEditorLanguage(language: string | null | undefined, typeName: string): string {
  const key = language?.trim().toLowerCase() ?? "";
  if (!key) return typeName === "command" ? "shell" : "plaintext";
  const id = LANGUAGE_ALIASES[key] ?? key;
  return MONACO_LANGUAGES.has(id) ? id : "plaintext";
}

export function getEditorLineHeight(fontSize: number): number {
  return Math.round(fontSize * EDITOR_LINE_HEIGHT_RATIO);
}

// The editor grows with its content, from the mode's minimum up to the 400px cap.
export function getEditorHeight(contentHeight: number, readOnly: boolean): number {
  const min = readOnly ? EDITOR_MIN_HEIGHT.readOnly : EDITOR_MIN_HEIGHT.edit;
  return Math.min(Math.max(Math.ceil(contentHeight), min), EDITOR_MAX_HEIGHT);
}

// Monaco's content height for unwrapped text, used to size the editor before it
// loads so it doesn't jump once it measures itself.
export function estimateContentHeight(value: string, lineHeight: number): number {
  const lines = value.split("\n").length;
  return lines * lineHeight + EDITOR_PADDING * 2;
}
