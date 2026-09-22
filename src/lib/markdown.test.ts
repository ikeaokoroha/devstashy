import { describe, expect, it } from "vitest";

import { isMarkdownType } from "./markdown";

describe("isMarkdownType", () => {
  it("is true for prompts and notes only", () => {
    expect(isMarkdownType("prompt")).toBe(true);
    expect(isMarkdownType("note")).toBe(true);
    expect(isMarkdownType("snippet")).toBe(false);
    expect(isMarkdownType("command")).toBe(false);
    expect(isMarkdownType("link")).toBe(false);
  });
});
