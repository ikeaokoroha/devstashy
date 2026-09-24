"use client";

import type { ReactNode } from "react";

import { useEditorPreferences } from "@/components/editor/EditorPreferencesProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  EDITOR_FONT_SIZES,
  EDITOR_TAB_SIZES,
  EDITOR_THEMES,
  EDITOR_THEME_LABELS,
} from "@/lib/editor-preferences";
import type { EditorTheme } from "@/types/editor";

interface SettingRowProps {
  id: string;
  label: string;
  description: string;
  children: ReactNode;
}

// Label and description on the left, the control on the right; stacked on a phone.
function SettingRow({ id, label, description, children }: SettingRowProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="space-y-0.5">
        <Label htmlFor={id}>{label}</Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}

// The editor settings, saved as each control changes rather than behind a button.
export function EditorPreferencesCard() {
  const { preferences, setPreference, isSaving } = useEditorPreferences();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Editor
          {/* Auto-save has no button to put a pending state on, so the card says so. */}
          {isSaving && <span className="text-sm font-normal text-muted-foreground">Saving…</span>}
        </CardTitle>
        <CardDescription>
          How code snippets and commands look in the editor. Changes save on their own.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <SettingRow id="editor-font-size" label="Font size" description="Text size in the editor.">
          <Select
            value={preferences.fontSize}
            onValueChange={(value) => value !== null && setPreference("fontSize", value)}
          >
            <SelectTrigger id="editor-font-size" className="w-32">
              {/* Base UI renders the raw value unless it's formatted here. */}
              <SelectValue>{(size: number) => `${size}px`}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {EDITOR_FONT_SIZES.map((size) => (
                <SelectItem key={size} value={size}>
                  {size}px
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingRow>

        <SettingRow
          id="editor-tab-size"
          label="Tab size"
          description="Spaces a tab is worth."
        >
          <Select
            value={preferences.tabSize}
            onValueChange={(value) => value !== null && setPreference("tabSize", value)}
          >
            <SelectTrigger id="editor-tab-size" className="w-32">
              <SelectValue>{(size: number) => `${size} spaces`}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {EDITOR_TAB_SIZES.map((size) => (
                <SelectItem key={size} value={size}>
                  {size} spaces
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingRow>

        <SettingRow
          id="editor-word-wrap"
          label="Word wrap"
          description="Wrap long lines instead of scrolling sideways."
        >
          <Switch
            id="editor-word-wrap"
            checked={preferences.wordWrap}
            onCheckedChange={(checked) => setPreference("wordWrap", checked)}
          />
        </SettingRow>

        <SettingRow
          id="editor-minimap"
          label="Minimap"
          description="Show the overview strip down the right edge."
        >
          <Switch
            id="editor-minimap"
            checked={preferences.minimap}
            onCheckedChange={(checked) => setPreference("minimap", checked)}
          />
        </SettingRow>

        <SettingRow id="editor-theme" label="Theme" description="Editor colour scheme.">
          <Select
            value={preferences.theme}
            onValueChange={(value) => value !== null && setPreference("theme", value)}
          >
            <SelectTrigger id="editor-theme" className="w-40">
              <SelectValue>{(theme: EditorTheme) => EDITOR_THEME_LABELS[theme]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {EDITOR_THEMES.map((theme) => (
                <SelectItem key={theme} value={theme}>
                  {EDITOR_THEME_LABELS[theme]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingRow>
      </CardContent>
    </Card>
  );
}
