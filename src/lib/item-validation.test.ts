import { describe, expect, it } from "vitest";

import {
  CREATABLE_ITEM_TYPES,
  createItemSchema,
  getEditableFields,
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
  it("accepts the creatable types", () => {
    for (const type of CREATABLE_ITEM_TYPES) {
      const url = type === "link" ? "https://nextjs.org" : null;
      expect(createItemSchema.safeParse({ ...valid, type, url }).success).toBe(true);
    }
  });

  it("rejects file, image and unknown types", () => {
    for (const type of ["file", "image", "widget"]) {
      const result = createItemSchema.safeParse({ ...valid, type });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toEqual(["type"]);
    }
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
    expect(getEditableFields("snippet")).toEqual({ content: true, language: true, url: false });
  });

  it("allows content but no language for notes", () => {
    expect(getEditableFields("note")).toEqual({ content: true, language: false, url: false });
  });

  it("allows only the URL for links", () => {
    expect(getEditableFields("link")).toEqual({ content: false, language: false, url: true });
  });

  it("allows none of them for files", () => {
    expect(getEditableFields("file")).toEqual({ content: false, language: false, url: false });
  });
});
