// Item types whose content is Markdown and gets the Write/Preview editor.
const MARKDOWN_TYPES = new Set(["prompt", "note"]);

export function isMarkdownType(typeName: string): boolean {
  return MARKDOWN_TYPES.has(typeName);
}
