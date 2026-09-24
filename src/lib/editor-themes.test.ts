import { describe, expect, it } from "vitest";

import { EDITOR_THEMES } from "./editor-preferences";
import {
  EDITOR_THEME_DEFINITION_LIST,
  EDITOR_THEME_DEFINITIONS,
  getMonacoThemeName,
} from "./editor-themes";

describe("getMonacoThemeName", () => {
  it("namespaces the theme so it can't collide with Monaco's built-ins", () => {
    expect(getMonacoThemeName("vs-dark")).toBe("devstash-vs-dark");
    expect(getMonacoThemeName("monokai")).toBe("devstash-monokai");
  });
});

describe("EDITOR_THEME_DEFINITIONS", () => {
  // Adding a theme option without defining its colours would leave Monaco with an
  // unregistered theme name, so every option is checked here.
  it("defines every theme the dropdown offers", () => {
    for (const theme of EDITOR_THEMES) {
      expect(EDITOR_THEME_DEFINITIONS[theme]).toBeDefined();
    }
    expect(Object.keys(EDITOR_THEME_DEFINITIONS)).toHaveLength(EDITOR_THEMES.length);
  });

  it("keeps the editor and gutter transparent, so the window frame shows through", () => {
    for (const theme of EDITOR_THEMES) {
      const { colors } = EDITOR_THEME_DEFINITIONS[theme];
      expect(colors["editor.background"]).toBe("#00000000");
      expect(colors["editorGutter.background"]).toBe("#00000000");
    }
  });

  it("inherits a dark base, since the app is dark only", () => {
    for (const theme of EDITOR_THEMES) {
      const definition = EDITOR_THEME_DEFINITIONS[theme];
      expect(definition.base).toBe("vs-dark");
      expect(definition.inherit).toBe(true);
    }
  });

  // Monaco wants rule colours bare and the colours map prefixed; mixing them up
  // fails silently, with the token simply not coloured.
  it("writes rule colours without a # and map colours with one", () => {
    for (const theme of EDITOR_THEMES) {
      const { rules, colors } = EDITOR_THEME_DEFINITIONS[theme];
      for (const rule of rules) {
        expect(rule.foreground).toMatch(/^[0-9a-f]{6}$/);
      }
      for (const color of Object.values(colors)) {
        expect(color).toMatch(/^#[0-9a-f]{6,8}$/);
      }
    }
  });
});

describe("EDITOR_THEME_DEFINITION_LIST", () => {
  it("pairs every theme's registered name with its definition", () => {
    expect(EDITOR_THEME_DEFINITION_LIST).toHaveLength(EDITOR_THEMES.length);
    expect(EDITOR_THEME_DEFINITION_LIST.map((entry) => entry.name)).toEqual(
      EDITOR_THEMES.map(getMonacoThemeName)
    );
  });
});
