import { describe, expect, it } from "vitest";

import {
  DEFAULT_EDITOR_PREFERENCES,
  EDITOR_FONT_SIZES,
  EDITOR_TAB_SIZES,
  EDITOR_THEMES,
  EDITOR_THEME_LABELS,
  editorPreferencesSchema,
  parseEditorPreferences,
} from "./editor-preferences";

const VALID = {
  fontSize: 14,
  tabSize: 4,
  wordWrap: false,
  minimap: true,
  theme: "monokai",
} as const;

describe("defaults", () => {
  it("match the values the editor used before preferences existed", () => {
    expect(DEFAULT_EDITOR_PREFERENCES).toEqual({
      fontSize: 12,
      tabSize: 2,
      wordWrap: true,
      minimap: false,
      theme: "vs-dark",
    });
  });

  it("are all listed options", () => {
    expect(EDITOR_FONT_SIZES).toContain(DEFAULT_EDITOR_PREFERENCES.fontSize);
    expect(EDITOR_TAB_SIZES).toContain(DEFAULT_EDITOR_PREFERENCES.tabSize);
    expect(EDITOR_THEMES).toContain(DEFAULT_EDITOR_PREFERENCES.theme);
  });

  it("label every theme option", () => {
    for (const theme of EDITOR_THEMES) {
      expect(EDITOR_THEME_LABELS[theme]).toBeTruthy();
    }
  });
});

describe("editorPreferencesSchema", () => {
  it("accepts a complete set of listed values", () => {
    const parsed = editorPreferencesSchema.safeParse(VALID);
    expect(parsed.success).toBe(true);
    expect(parsed.data).toEqual(VALID);
  });

  it("accepts every option the dropdowns offer", () => {
    for (const fontSize of EDITOR_FONT_SIZES) {
      expect(editorPreferencesSchema.safeParse({ ...VALID, fontSize }).success).toBe(true);
    }
    for (const tabSize of EDITOR_TAB_SIZES) {
      expect(editorPreferencesSchema.safeParse({ ...VALID, tabSize }).success).toBe(true);
    }
    for (const theme of EDITOR_THEMES) {
      expect(editorPreferencesSchema.safeParse({ ...VALID, theme }).success).toBe(true);
    }
  });

  it("rejects values outside the options", () => {
    expect(editorPreferencesSchema.safeParse({ ...VALID, fontSize: 13.5 }).success).toBe(false);
    expect(editorPreferencesSchema.safeParse({ ...VALID, fontSize: 96 }).success).toBe(false);
    expect(editorPreferencesSchema.safeParse({ ...VALID, tabSize: 3 }).success).toBe(false);
    expect(editorPreferencesSchema.safeParse({ ...VALID, theme: "dracula" }).success).toBe(false);
  });

  it("rejects a partial set, since a save always sends every field", () => {
    expect(editorPreferencesSchema.safeParse({ fontSize: 14 }).success).toBe(false);
    const withoutWordWrap: Record<string, unknown> = { ...VALID };
    delete withoutWordWrap.wordWrap;
    expect(editorPreferencesSchema.safeParse(withoutWordWrap).success).toBe(false);
  });

  it("rejects strings where booleans belong, so a form value can't slip through", () => {
    expect(editorPreferencesSchema.safeParse({ ...VALID, wordWrap: "true" }).success).toBe(false);
    expect(editorPreferencesSchema.safeParse({ ...VALID, fontSize: "14" }).success).toBe(false);
  });
});

describe("parseEditorPreferences", () => {
  it("returns a stored set unchanged", () => {
    expect(parseEditorPreferences(VALID)).toEqual(VALID);
  });

  it("falls back to the defaults for an unset column", () => {
    expect(parseEditorPreferences(null)).toEqual(DEFAULT_EDITOR_PREFERENCES);
    expect(parseEditorPreferences(undefined)).toEqual(DEFAULT_EDITOR_PREFERENCES);
  });

  it("falls back to the defaults for a value that isn't an object", () => {
    expect(parseEditorPreferences("vs-dark")).toEqual(DEFAULT_EDITOR_PREFERENCES);
    expect(parseEditorPreferences(42)).toEqual(DEFAULT_EDITOR_PREFERENCES);
    expect(parseEditorPreferences([])).toEqual(DEFAULT_EDITOR_PREFERENCES);
  });

  it("fills in missing fields without discarding the ones that are there", () => {
    expect(parseEditorPreferences({ theme: "github-dark" })).toEqual({
      ...DEFAULT_EDITOR_PREFERENCES,
      theme: "github-dark",
    });
  });

  it("replaces only the invalid fields, so one bad value doesn't reset the rest", () => {
    expect(parseEditorPreferences({ ...VALID, fontSize: 96, theme: "dracula" })).toEqual({
      ...VALID,
      fontSize: DEFAULT_EDITOR_PREFERENCES.fontSize,
      theme: DEFAULT_EDITOR_PREFERENCES.theme,
    });
  });

  it("ignores extra keys left by an older shape", () => {
    expect(parseEditorPreferences({ ...VALID, lineNumbers: "off" })).toEqual(VALID);
  });
});
