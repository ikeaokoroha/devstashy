import { describe, expect, it } from "vitest";

import {
  getAcceptAttribute,
  getFileExtension,
  getMaxUploadSize,
  isFileItemType,
  validateUpload,
} from "@/lib/file-upload";

describe("isFileItemType", () => {
  it("names only the two types that hold an upload", () => {
    expect(isFileItemType("file")).toBe(true);
    expect(isFileItemType("image")).toBe(true);
    expect(isFileItemType("snippet")).toBe(false);
  });
});

describe("getFileExtension", () => {
  it("lowercases the extension", () => {
    expect(getFileExtension("Diagram.PNG")).toBe("png");
  });

  it("takes the last extension", () => {
    expect(getFileExtension("archive.tar.gz")).toBe("gz");
  });

  it("returns an empty string when there's no extension", () => {
    expect(getFileExtension("Dockerfile")).toBe("");
  });
});

describe("getMaxUploadSize", () => {
  it("matches the spec's 5 MB and 10 MB limits", () => {
    expect(getMaxUploadSize("image")).toBe(5 * 1024 * 1024);
    expect(getMaxUploadSize("file")).toBe(10 * 1024 * 1024);
  });
});

describe("getAcceptAttribute", () => {
  it("lists the type's extensions with dots", () => {
    expect(getAcceptAttribute("image")).toBe(".png,.jpg,.jpeg,.gif,.webp,.svg");
  });
});

describe("validateUpload", () => {
  const image = { typeName: "image", fileName: "logo.png", size: 1024, mimeType: "image/png" };
  const file = { typeName: "file", fileName: "notes.md", size: 1024, mimeType: "text/markdown" };

  it("accepts a valid image and reports its canonical content type", () => {
    expect(validateUpload(image)).toEqual({ ok: true, extension: "png", contentType: "image/png" });
  });

  it("accepts a valid file", () => {
    expect(validateUpload(file)).toEqual({
      ok: true,
      extension: "md",
      contentType: "text/markdown",
    });
  });

  it("rejects a type that doesn't take a file at all", () => {
    const result = validateUpload({ ...image, typeName: "snippet" });

    expect(result).toEqual({ ok: false, error: "This item type doesn't take a file." });
  });

  it("rejects an extension the type doesn't allow", () => {
    const result = validateUpload({ ...image, fileName: "script.exe", mimeType: "" });

    expect(result.ok).toBe(false);
  });

  it("rejects a file extension uploaded as an image", () => {
    expect(validateUpload({ ...image, fileName: "notes.md" }).ok).toBe(false);
  });

  it("rejects a file over its type's limit", () => {
    const result = validateUpload({ ...image, size: 6 * 1024 * 1024 });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("5 MB");
    }
  });

  it("allows a file up to exactly the limit", () => {
    expect(validateUpload({ ...file, size: 10 * 1024 * 1024 }).ok).toBe(true);
  });

  it("rejects an empty file", () => {
    expect(validateUpload({ ...image, size: 0 })).toEqual({ ok: false, error: "This file is empty." });
  });

  it("rejects a name with no extension", () => {
    expect(validateUpload({ ...file, fileName: "Dockerfile" }).ok).toBe(false);
  });

  // Browsers report these inconsistently, so the extension has to be enough.
  it("accepts a blank or generic MIME type", () => {
    expect(validateUpload({ ...file, fileName: "config.toml", mimeType: "" }).ok).toBe(true);
    expect(
      validateUpload({ ...file, fileName: "settings.ini", mimeType: "application/octet-stream" }).ok
    ).toBe(true);
  });

  it("rejects a specific MIME type that contradicts the extension", () => {
    const result = validateUpload({ ...image, fileName: "logo.png", mimeType: "application/pdf" });

    expect(result.ok).toBe(false);
  });

  it("accepts the alternative MIME types a browser may report", () => {
    expect(validateUpload({ ...file, fileName: "data.csv", mimeType: "application/vnd.ms-excel" }).ok).toBe(
      true
    );
    expect(validateUpload({ ...file, fileName: "config.yml", mimeType: "text/yaml" }).ok).toBe(true);
  });

  it("ignores the case of the extension and the reported type", () => {
    expect(validateUpload({ ...image, fileName: "LOGO.PNG", mimeType: "IMAGE/PNG" }).ok).toBe(true);
  });
});
