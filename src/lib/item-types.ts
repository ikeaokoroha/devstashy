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
  borderClass: string;
  bgClass: string;
  dotClass: string;
}

// Display order for the system types, matching the project spec.
export const SYSTEM_ITEM_TYPE_ORDER = [
  "snippet",
  "prompt",
  "command",
  "note",
  "file",
  "image",
  "link",
];

const DEFAULT_ITEM_TYPE_STYLE: ItemTypeStyle = {
  icon: File,
  textClass: "text-muted-foreground",
  borderClass: "border-l-border",
  bgClass: "bg-muted",
  dotClass: "bg-muted-foreground",
};

// Keyed by system type name. Tailwind only generates classes it sees in full,
// so each color maps to a --color-type-* token defined in globals.css.
const ITEM_TYPE_STYLES: Record<string, ItemTypeStyle> = {
  snippet: {
    icon: Code,
    textClass: "text-type-snippet",
    borderClass: "border-l-type-snippet",
    bgClass: "bg-type-snippet/10",
    dotClass: "bg-type-snippet",
  },
  prompt: {
    icon: Sparkles,
    textClass: "text-type-prompt",
    borderClass: "border-l-type-prompt",
    bgClass: "bg-type-prompt/10",
    dotClass: "bg-type-prompt",
  },
  command: {
    icon: Terminal,
    textClass: "text-type-command",
    borderClass: "border-l-type-command",
    bgClass: "bg-type-command/10",
    dotClass: "bg-type-command",
  },
  note: {
    icon: StickyNote,
    textClass: "text-type-note",
    borderClass: "border-l-type-note",
    bgClass: "bg-type-note/10",
    dotClass: "bg-type-note",
  },
  file: {
    icon: File,
    textClass: "text-type-file",
    borderClass: "border-l-type-file",
    bgClass: "bg-type-file/10",
    dotClass: "bg-type-file",
  },
  image: {
    icon: ImageIcon,
    textClass: "text-type-image",
    borderClass: "border-l-type-image",
    bgClass: "bg-type-image/10",
    dotClass: "bg-type-image",
  },
  link: {
    icon: LinkIcon,
    textClass: "text-type-link",
    borderClass: "border-l-type-link",
    bgClass: "bg-type-link/10",
    dotClass: "bg-type-link",
  },
};

export function getItemTypeStyle(typeName: string): ItemTypeStyle {
  return ITEM_TYPE_STYLES[typeName] ?? DEFAULT_ITEM_TYPE_STYLE;
}
