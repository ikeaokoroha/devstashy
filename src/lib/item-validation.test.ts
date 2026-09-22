import { describe, expect, it } from "vitest";

import {
  CREATABLE_ITEM_TYPES,
  createItemSchema,
  getEditableFields,
  isCreatableItemType,
  parseTags,
  updateItemSchema,
} from "@/lib/item-validation";

const valid = {
  title: "useAuth Hook",
  description: "Custom hook",
  content: "export function useAuth() {}",
  language: "typescript",
  url: null,
  tags: ["auth"],
};

describe("updateItemSchema", () => {
  it("trims the title and rejects a blank one", () => {
    expect(updateItemSchema.parse({ ...valid, title: "  Hook  " }).title).toBe("Hook");
    expect(updateItemSchema.safeParse({ ...valid, title: "   " }).success).toBe(false);
  });

  it("stores blank optional fields as null", () => {
    const data = updateItemSchema.parse({
      ...valid,
      description: "  ",
      content: "\n  ",
      language: "",
      url: "",
    });

    expect(data).toMatchObject({ description: null, content: null, language: null, url: null });
  });

  it("keeps the content's leading indentation", () => {
    const content = "  indented();\n";
    expect(updateItemSchema.parse({ ...valid, content }).content).toBe(content);
  });

  it("accepts http(s) URLs only", () => {
    expect(updateItemSchema.parse({ ...valid, url: " https://nextjs.org " }).url).toBe(
      "https://nextjs.org"
    );
    expect(updateItemSchema.safeParse({ ...valid, url: "not a url" }).success).toBe(false);
    expect(updateItemSchema.safeParse({ ...valid, url: "javascript:alert(1)" }).success).toBe(false);
  });

  it("trims tags and drops blanks and duplicates", () => {
    const data = updateItemSchema.parse({ ...valid, tags: [" react ", "", "react", "hooks"] });
    expect(data.tags).toEqual(["react", "hooks"]);
  });
});

describe("createItemSchema", () => {
  const upload = {
    fileUrl: "https://pub-test.r2.dev/user-1/abc.png",
    fileName: "logo.png",
    fileSize: 2048,
  };

  it("accepts the creatable types", () => {
    for (const type of CREATABLE_ITEM_TYPES) {
      const extra = type === "link" ? { url: "https://nextjs.org" } : { url: null };
      const file = type === "file" || type === "image" ? upload : {};
      expect(createItemSchema.safeParse({ ...valid, type, ...extra, ...file }).success).toBe(true);
    }
  });

  it("rejects an unknown type", () => {
    const result = createItemSchema.safeParse({ ...valid, type: "widget" });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["type"]);
  });

  it("requires an uploaded file for files and images", () => {
    for (const type of ["file", "image"]) {
      const result = createItemSchema.safeParse({ ...valid, type });

      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual([
        expect.objectContaining({ path: ["fileUrl"], message: "Upload a file" }),
      ]);
    }
  });

  it("requires every part of the upload, not just the URL", () => {
    const result = createItemSchema.safeParse({
      ...valid,
      type: "file",
      ...upload,
      fileSize: null,
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["fileUrl"]);
  });

  it("doesn't require a file for other types", () => {
    expect(createItemSchema.safeParse({ ...valid, type: "note" }).success).toBe(true);
  });

  it("requires a URL for links", () => {
    const result = createItemSchema.safeParse({ ...valid, type: "link", url: "  " });

    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      expect.objectContaining({ path: ["url"], message: "URL is required" }),
    ]);
  });

  it("doesn't require a URL for other types", () => {
    expect(createItemSchema.safeParse({ ...valid, type: "snippet", url: "" }).success).toBe(true);
  });

  it("applies the edit rules to the shared fields", () => {
    const result = createItemSchema.safeParse({ ...valid, type: "note", title: "  " });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["title"]);
  });
});

describe("isCreatableItemType", () => {
  it("accepts every creatable type and rejects unknown names", () => {
    for (const type of CREATABLE_ITEM_TYPES) {
      expect(isCreatableItemType(type)).toBe(true);
    }
    expect(isCreatableItemType("snippets")).toBe(false);
    expect(isCreatableItemType("widget")).toBe(false);
  });
});

describe("parseTags", () => {
  it("splits on commas, trimming and de-duplicating", () => {
    expect(parseTags("react, hooks,, react ")).toEqual(["react", "hooks"]);
  });

  it("returns no tags for an empty input", () => {
    expect(parseTags("  ")).toEqual([]);
  });
});

describe("getEditableFields", () => {
  it("allows content and language for snippets", () => {
    expect(getEditableFields("snippet")).toEqual({
      content: true,
      language: true,
      url: false,
      file: false,
    });
  });

  it("allows content but no language for notes", () => {
    expect(getEditableFields("note")).toEqual({
      content: true,
      language: false,
      url: false,
      file: false,
    });
  });

  it("allows only the URL for links", () => {
    expect(getEditableFields("link")).toEqual({
      content: false,
      language: false,
      url: true,
      file: false,
    });
  });

  it("allows only the file for files and images", () => {
    const fields = { content: false, language: false, url: false, file: true };

    expect(getEditableFields("file")).toEqual(fields);
    expect(getEditableFields("image")).toEqual(fields);
  });
});
