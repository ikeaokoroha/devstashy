import {
  File,
  FileCode,
  FileImage,
  FileJson,
  FileSpreadsheet,
  FileText,
  type LucideIcon,
} from "lucide-react";

import { getFileExtension } from "@/lib/file-upload";

// The icon a file row shows, keyed by extension. Covers everything the upload
// rules allow plus the image extensions, since a file item's name is whatever
// was uploaded; anything unrecognised falls back to the plain file sheet.
const FILE_ICONS: Record<string, LucideIcon> = {
  pdf: FileText,
  txt: FileText,
  md: FileText,
  json: FileJson,
  xml: FileCode,
  yaml: FileCode,
  yml: FileCode,
  toml: FileCode,
  ini: FileCode,
  csv: FileSpreadsheet,
  png: FileImage,
  jpg: FileImage,
  jpeg: FileImage,
  gif: FileImage,
  webp: FileImage,
  svg: FileImage,
};

// "notes.md" → FileText. Files with no name or an unknown extension get File.
// Wrapped in an object like getItemTypeStyle, so a row destructures the icon
// rather than binding a call's return straight to a capitalized name, which
// react-hooks/static-components reads as a component built during render.
export function getFileIcon(fileName: string | null): { icon: LucideIcon } {
  if (!fileName) return { icon: File };
  return { icon: FILE_ICONS[getFileExtension(fileName)] ?? File };
}
