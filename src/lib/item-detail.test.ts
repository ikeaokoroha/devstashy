import { describe, expect, it } from "vitest";

import {
  formatFileSize,
  getCardCopyText,
  getContentLabel,
  getCopyText,
  getSafeHref,
  toItemDetailJson,
} from "@/lib/item-detail";
import type { ItemDetail } from "@/types/items";

describe("getSafeHref", () => {
  it("allows http and https URLs", () => {
    expect(getSafeHref("https://react.dev/learn")).toBe("https://react.dev/learn");
    expect(getSafeHref("http://localhost:3000")).toBe("http://localhost:3000/");
  });

  it("rejects other protocols and unparseable values", () => {
    expect(getSafeHref("javascript:alert(1)")).toBeNull();
    expect(getSafeHref("data:text/html,<script></script>")).toBeNull();
    expect(getSafeHref("not a url")).toBeNull();
  });
});

describe("formatFileSize", () => {
  it("picks the largest unit that keeps the number at least 1", () => {
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(1536)).toBe("1.5 KB");
    expect(formatFileSize(5 * 1024 * 1024)).toBe("5 MB");
  });

  it("stops at GB for anything larger", () => {
    expect(formatFileSize(2 * 1024 ** 4)).toBe("2048 GB");
  });

  it("treats negative sizes as zero", () => {
    expect(formatFileSize(-10)).toBe("0 B");
  });
});

describe("getContentLabel", () => {
  it("labels each content type", () => {
    expect(getContentLabel("TEXT")).toBe("Content");
    expect(getContentLabel("URL")).toBe("URL");
    expect(getContentLabel("FILE")).toBe("File");
  });
});

describe("getCopyText", () => {
  const empty = { content: null, url: null, fileUrl: null };

  it("copies the field that matches the content type", () => {
    expect(getCopyText({ ...empty, contentType: "TEXT", content: "npm run dev" })).toBe("npm run dev");
    expect(getCopyText({ ...empty, contentType: "URL", url: "https://nextjs.org" })).toBe("https://nextjs.org");
    expect(getCopyText({ ...empty, contentType: "FILE", fileUrl: "https://r2.dev/a.pdf" })).toBe("https://r2.dev/a.pdf");
  });

  it("returns null when there is nothing to copy", () => {
    expect(getCopyText({ ...empty, contentType: "TEXT", content: "" })).toBeNull();
    expect(getCopyText({ ...empty, contentType: "URL", content: "ignored" })).toBeNull();
  });
});

describe("getCardCopyText", () => {
  type CardFields = { content: string | null; url: string | null; fileUrl: string | null };
  const empty: CardFields = { content: null, url: null, fileUrl: null };
  const card = (typeName: string, fields: Partial<CardFields> = {}) => ({
    ...empty,
    ...fields,
    itemType: { id: `type-${typeName}`, name: typeName },
  });

  it("copies the content for the text types", () => {
    for (const typeName of ["snippet", "prompt", "command", "note"]) {
      expect(getCardCopyText(card(typeName, { content: "npm run dev" }))).toBe("npm run dev");
    }
  });

  it("copies the url for a link and the file URL for file and image", () => {
    expect(getCardCopyText(card("link", { url: "https://nextjs.org" }))).toBe("https://nextjs.org");
    expect(getCardCopyText(card("file", { fileUrl: "https://r2.dev/a.pdf" }))).toBe("https://r2.dev/a.pdf");
    expect(getCardCopyText(card("image", { fileUrl: "https://r2.dev/a.png" }))).toBe("https://r2.dev/a.png");
  });

  it("ignores the fields the type doesn't use", () => {
    expect(getCardCopyText(card("link", { content: "ignored" }))).toBeNull();
    expect(getCardCopyText(card("image", { content: "ignored", url: "ignored" }))).toBeNull();
    expect(getCardCopyText(card("snippet", { url: "https://ignored.dev" }))).toBeNull();
  });

  it("returns null when there is nothing to copy", () => {
    expect(getCardCopyText(card("snippet"))).toBeNull();
    expect(getCardCopyText(card("snippet", { content: "" }))).toBeNull();
    expect(getCardCopyText(card("link"))).toBeNull();
  });

  it("falls back to the content for an unknown type", () => {
    expect(getCardCopyText(card("diagram", { content: "graph TD" }))).toBe("graph TD");
  });
});

describe("toItemDetailJson", () => {
  it("turns the dates into ISO strings and keeps everything else", () => {
    const item = {
      id: "item-1",
      title: "useAuth Hook",
      tags: ["auth"],
      createdAt: new Date("2026-01-15T10:00:00Z"),
      updatedAt: new Date("2026-02-01T08:30:00Z"),
    } as ItemDetail;

    expect(toItemDetailJson(item)).toEqual({
      id: "item-1",
      title: "useAuth Hook",
      tags: ["auth"],
      createdAt: "2026-01-15T10:00:00.000Z",
      updatedAt: "2026-02-01T08:30:00.000Z",
    });
  });
});
