import { describe, expect, it } from "vitest";

import {
  EDITOR_LINE_HEIGHT,
  EDITOR_MAX_HEIGHT,
  EDITOR_PADDING,
  estimateContentHeight,
  getEditorHeight,
  getEditorLanguage,
  isCodeType,
} from "./code-editor";

describe("isCodeType", () => {
  it("is true for snippets and commands only", () => {
    expect(isCodeType("snippet")).toBe(true);
    expect(isCodeType("command")).toBe(true);
    expect(isCodeType("prompt")).toBe(false);
    expect(isCodeType("note")).toBe(false);
    expect(isCodeType("link")).toBe(false);
  });
});

describe("getEditorLanguage", () => {
  it("maps aliases to Monaco ids, ignoring case and whitespace", () => {
    expect(getEditorLanguage("TS", "snippet")).toBe("typescript");
    expect(getEditorLanguage(" bash ", "command")).toBe("shell");
    expect(getEditorLanguage("yml", "snippet")).toBe("yaml");
  });

  it("keeps languages Monaco already knows", () => {
    expect(getEditorLanguage("python", "snippet")).toBe("python");
    expect(getEditorLanguage("sql", "command")).toBe("sql");
  });

  it("defaults commands to shell and snippets to plain text when blank", () => {
    expect(getEditorLanguage(null, "command")).toBe("shell");
    expect(getEditorLanguage("  ", "command")).toBe("shell");
    expect(getEditorLanguage(undefined, "snippet")).toBe("plaintext");
  });

  it("falls back to plain text for unknown languages", () => {
    expect(getEditorLanguage("brainfuck", "snippet")).toBe("plaintext");
    expect(getEditorLanguage("brainfuck", "command")).toBe("plaintext");
  });
});

describe("getEditorHeight", () => {
  it("follows the content height, rounded up", () => {
    expect(getEditorHeight(180.2, false)).toBe(181);
    expect(getEditorHeight(19, true)).toBe(19);
  });

  it("keeps room to type when editing", () => {
    expect(getEditorHeight(19, false)).toBe(120);
  });

  it("caps at the max height", () => {
    expect(getEditorHeight(2000, false)).toBe(EDITOR_MAX_HEIGHT);
    expect(getEditorHeight(2000, true)).toBe(EDITOR_MAX_HEIGHT);
  });
});

describe("estimateContentHeight", () => {
  it("counts lines plus top and bottom padding", () => {
    expect(estimateContentHeight("")).toBe(EDITOR_LINE_HEIGHT + EDITOR_PADDING * 2);
    expect(estimateContentHeight("a\nb\nc")).toBe(3 * EDITOR_LINE_HEIGHT + EDITOR_PADDING * 2);
  });
});
