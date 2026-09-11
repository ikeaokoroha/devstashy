import {
  Code,
  File,
  ImageIcon,
  LinkIcon,
  Sparkles,
  StickyNote,
  Terminal,
  type LucideIcon,
} from "lucide-react";

interface ItemTypeStyle {
  icon: LucideIcon;
  textClass: string;
}

const DEFAULT_ITEM_TYPE_STYLE: ItemTypeStyle = {
  icon: File,
  textClass: "text-muted-foreground",
};

// Keyed by system type name. Tailwind only generates classes it sees in full,
// so each color maps to a --color-type-* token defined in globals.css.
const ITEM_TYPE_STYLES: Record<string, ItemTypeStyle> = {
  snippet: { icon: Code, textClass: "text-type-snippet" },
  prompt: { icon: Sparkles, textClass: "text-type-prompt" },
  command: { icon: Terminal, textClass: "text-type-command" },
  note: { icon: StickyNote, textClass: "text-type-note" },
  file: { icon: File, textClass: "text-type-file" },
  image: { icon: ImageIcon, textClass: "text-type-image" },
  link: { icon: LinkIcon, textClass: "text-type-link" },
};

export function getItemTypeStyle(typeName: string): ItemTypeStyle {
  return ITEM_TYPE_STYLES[typeName] ?? DEFAULT_ITEM_TYPE_STYLE;
}
