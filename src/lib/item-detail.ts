import type { ItemContentType } from "@/generated/prisma/enums";
import type { ItemWithType } from "@/types/dashboard";
import type { ItemDetail, ItemDetailJson } from "@/types/items";

const SAFE_PROTOCOLS = new Set(["http:", "https:"]);
const FILE_SIZE_UNITS = ["B", "KB", "MB", "GB"];

// Types whose copy text is the stored url rather than the content.
const URL_ITEM_TYPES = new Set(["link"]);
// Types whose copy text is the uploaded file's URL.
const FILE_ITEM_TYPES = new Set(["file", "image"]);

// The href to link a stored URL with, or null for anything that isn't plain
// http(s) — a saved "javascript:" URL must never become a clickable link.
export function getSafeHref(value: string): string | null {
  try {
    const url = new URL(value);
    return SAFE_PROTOCOLS.has(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

// 1536 → "1.5 KB". Whole numbers drop the decimal.
export function formatFileSize(bytes: number): string {
  let size = Math.max(bytes, 0);
  let unit = 0;
  while (size >= 1024 && unit < FILE_SIZE_UNITS.length - 1) {
    size /= 1024;
    unit += 1;
  }
  const rounded = Math.round(size * 10) / 10;
  return `${rounded} ${FILE_SIZE_UNITS[unit]}`;
}

// Heading for the drawer's main section, by what the item holds.
export function getContentLabel(contentType: ItemContentType): string {
  if (contentType === "URL") return "URL";
  if (contentType === "FILE") return "File";
  return "Content";
}

// A server action returns real Dates; the drawer keeps the item in the same
// shape /api/items/[id] sends, with ISO strings.
export function toItemDetailJson(item: ItemDetail): ItemDetailJson {
  return {
    ...item,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

// What a card's copy button puts on the clipboard, or null when there's nothing
// to copy. Same rule as getCopyText, but keyed on the type name: a card carries
// its item type, not the contentType the drawer's full item has.
export function getCardCopyText(
  item: Pick<ItemWithType, "content" | "url" | "fileUrl" | "itemType">
): string | null {
  const typeName = item.itemType.name;
  if (URL_ITEM_TYPES.has(typeName)) return item.url || null;
  if (FILE_ITEM_TYPES.has(typeName)) return item.fileUrl || null;
  return item.content || null;
}

// What the drawer's Copy button puts on the clipboard, or null when there's nothing to copy.
export function getCopyText(
  item: Pick<ItemDetailJson, "contentType" | "content" | "url" | "fileUrl">
): string | null {
  if (item.contentType === "URL") return item.url || null;
  if (item.contentType === "FILE") return item.fileUrl || null;
  return item.content || null;
}
