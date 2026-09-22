import { formatFileSize } from "@/lib/item-detail";

// The two system types that hold an uploaded file rather than text or a URL.
export const FILE_ITEM_TYPES = ["file", "image"] as const;

export type FileItemType = (typeof FILE_ITEM_TYPES)[number];

export function isFileItemType(typeName: string): typeName is FileItemType {
  return (FILE_ITEM_TYPES as readonly string[]).includes(typeName);
}

const MB = 1024 * 1024;

interface UploadRules {
  maxSize: number;
  // Extension (lowercase, no dot) → the MIME types a browser may report for it.
  // The extension is the allowlist; the MIME is only checked when it's reliable.
  extensions: Record<string, readonly string[]>;
}

const UPLOAD_RULES = {
  image: {
    maxSize: 5 * MB,
    extensions: {
      png: ["image/png"],
      jpg: ["image/jpeg"],
      jpeg: ["image/jpeg"],
      gif: ["image/gif"],
      webp: ["image/webp"],
      svg: ["image/svg+xml"],
    },
  },
  file: {
    maxSize: 10 * MB,
    extensions: {
      pdf: ["application/pdf"],
      txt: ["text/plain"],
      md: ["text/markdown", "text/plain"],
      json: ["application/json", "text/plain"],
      yaml: ["application/x-yaml", "text/yaml", "text/plain"],
      yml: ["application/x-yaml", "text/yaml", "text/plain"],
      xml: ["application/xml", "text/xml"],
      // Windows reports .csv as an Excel type when Excel is installed.
      csv: ["text/csv", "application/vnd.ms-excel", "text/plain"],
      toml: ["application/toml", "text/plain"],
      ini: ["text/plain"],
    },
  },
} as const satisfies Record<FileItemType, UploadRules>;

// Browsers report text-ish files inconsistently — an empty string for .md or
// .toml, the generic binary type for .ini — so these are treated as "unknown"
// and the extension decides on its own. A specific but wrong type is rejected.
const UNRELIABLE_MIME_TYPES = new Set(["", "application/octet-stream", "application/x-empty"]);

// "Diagram.PNG" → "png". Files with no extension give "".
export function getFileExtension(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot === -1 ? "" : fileName.slice(dot + 1).toLowerCase();
}

export function getMaxUploadSize(typeName: FileItemType): number {
  return UPLOAD_RULES[typeName].maxSize;
}

export function getAllowedExtensions(typeName: FileItemType): string[] {
  return Object.keys(UPLOAD_RULES[typeName].extensions);
}

// The file input's accept attribute, e.g. ".png,.jpg,.jpeg". A filter for the
// file picker only — every upload is re-checked server side.
export function getAcceptAttribute(typeName: FileItemType): string {
  return getAllowedExtensions(typeName)
    .map((extension) => `.${extension}`)
    .join(",");
}

export interface UploadInput {
  typeName: string;
  fileName: string;
  size: number;
  mimeType: string;
}

export type UploadValidation =
  | { ok: true; extension: string; contentType: string }
  | { ok: false; error: string };

// Checks one upload against its type's rules. The same function runs in the
// browser for immediate feedback and in the presign route, which is what counts.
export function validateUpload({
  typeName,
  fileName,
  size,
  mimeType,
}: UploadInput): UploadValidation {
  if (!isFileItemType(typeName)) {
    return { ok: false, error: "This item type doesn't take a file." };
  }

  // Annotated rather than inferred: the `as const` literal types narrow the two
  // rule sets to an incompatible union when indexed through the union key.
  const { maxSize, extensions }: UploadRules = UPLOAD_RULES[typeName];
  const label = typeName === "image" ? "Images" : "Files";

  if (!fileName.trim()) {
    return { ok: false, error: "This file has no name." };
  }

  const extension = getFileExtension(fileName);
  const allowed: readonly string[] | undefined = extensions[extension];
  if (!allowed) {
    return {
      ok: false,
      error: `${label} must be ${getAllowedExtensions(typeName)
        .map((value) => `.${value}`)
        .join(", ")}.`,
    };
  }

  if (size <= 0) {
    return { ok: false, error: "This file is empty." };
  }
  if (size > maxSize) {
    return {
      ok: false,
      error: `This file is ${formatFileSize(size)}. ${label} can be up to ${formatFileSize(maxSize)}.`,
    };
  }

  const reported = mimeType.trim().toLowerCase();
  if (!UNRELIABLE_MIME_TYPES.has(reported) && !allowed.includes(reported)) {
    return { ok: false, error: `A .${extension} file can't be a ${reported}.` };
  }

  // The extension's canonical type, so a blank or generic report still stores
  // something usable and the presigned URL is signed against a known value.
  return { ok: true, extension, contentType: allowed[0] };
}
