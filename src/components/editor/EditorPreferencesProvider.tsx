"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, useTransition } from "react";
import type { ReactNode } from "react";
import { toast } from "sonner";

import { saveEditorPreferences } from "@/actions/editor-preferences";
import type { EditorPreferences } from "@/types/editor";

interface EditorPreferencesContextValue {
  preferences: EditorPreferences;
  // Auto-save: there is no save button, so changing one setting writes the whole
  // object. The change shows immediately and is rolled back if the save fails.
  setPreference: <Key extends keyof EditorPreferences>(
    key: Key,
    value: EditorPreferences[Key]
  ) => void;
  isSaving: boolean;
}

const EditorPreferencesContext = createContext<EditorPreferencesContextValue | null>(null);

const SAVE_ERROR = "Couldn't save your editor settings. Please try again.";
// One id for every save, so flipping several settings replaces the toast instead
// of stacking one per change.
const TOAST_ID = "editor-preferences";

interface EditorPreferencesProviderProps {
  preferences: EditorPreferences;
  children: ReactNode;
}

// Holds the editor settings for the signed-in shell: the settings card writes
// them and every Monaco editor under it reads them, so a change reaches the open
// drawer and the New Item dialog without a refresh.
export function EditorPreferencesProvider({
  preferences: initialPreferences,
  children,
}: EditorPreferencesProviderProps) {
  const [preferences, setPreferences] = useState(initialPreferences);
  // The last value the database is known to hold, which a failed save falls back to.
  const savedRef = useRef(initialPreferences);
  // Only the newest save may report or roll back: an earlier one that resolves
  // late would otherwise revert a setting the user has since changed again.
  const requestRef = useRef(0);
  const [isSaving, startSaving] = useTransition();

  const setPreference = useCallback(
    <Key extends keyof EditorPreferences>(key: Key, value: EditorPreferences[Key]) => {
      // Base UI fires a change for a re-selected option too, which is not a save.
      if (preferences[key] === value) {
        return;
      }

      const next = { ...preferences, [key]: value };
      setPreferences(next);
      const requestId = requestRef.current + 1;
      requestRef.current = requestId;

      startSaving(async () => {
        try {
          const result = await saveEditorPreferences(next);
          // A success is recorded even when a newer save has overtaken it, so the
          // fallback is the newest value the database is known to hold: without
          // this, an ignored success followed by a failed save would roll the UI
          // back past a change that did commit.
          if (result.success) {
            savedRef.current = result.data?.preferences ?? next;
          }
          if (requestId !== requestRef.current) {
            return;
          }
          if (!result.success) {
            setPreferences(savedRef.current);
            toast.error(result.error ?? SAVE_ERROR, { id: TOAST_ID });
            return;
          }
          toast.success("Editor settings saved", { id: TOAST_ID });
        } catch {
          if (requestId === requestRef.current) {
            setPreferences(savedRef.current);
            toast.error(SAVE_ERROR, { id: TOAST_ID });
          }
        }
      });
    },
    [preferences]
  );

  const value = useMemo(
    () => ({ preferences, setPreference, isSaving }),
    [preferences, setPreference, isSaving]
  );

  return (
    <EditorPreferencesContext.Provider value={value}>{children}</EditorPreferencesContext.Provider>
  );
}

export function useEditorPreferences(): EditorPreferencesContextValue {
  const context = useContext(EditorPreferencesContext);
  if (!context) {
    throw new Error("useEditorPreferences must be used within an EditorPreferencesProvider");
  }
  return context;
}
