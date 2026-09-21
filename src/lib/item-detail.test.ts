import { describe, expect, it } from "vitest";

import { formatFileSize, getContentLabel, getCopyText, getSafeHref } from "@/lib/item-detail";

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
