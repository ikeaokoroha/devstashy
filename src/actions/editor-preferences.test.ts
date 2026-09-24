import { describe, expect, it, vi } from "vitest";

import { saveEditorPreferences } from "@/actions/editor-preferences";
import { updateEditorPreferences } from "@/lib/db/users";

vi.mock("@/lib/session", () => ({ requireUserId: vi.fn().mockResolvedValue("user-1") }));
vi.mock("@/lib/db/users", () => ({ updateEditorPreferences: vi.fn() }));

const preferences = {
  fontSize: 14,
  tabSize: 4,
  wordWrap: false,
  minimap: true,
  theme: "monokai",
} as const;

describe("saveEditorPreferences", () => {
  it("returns field errors without touching the database when a value isn't an option", async () => {
    // Cast because the input type forbids it, while the wire doesn't: a server
    // action can be posted anything, so the runtime check is what holds.
    const result = await saveEditorPreferences({ ...preferences, fontSize: 96 } as never);

    expect(result.success).toBe(false);
    expect(result.data?.fieldErrors?.fontSize).toBeDefined();
    expect(updateEditorPreferences).not.toHaveBeenCalled();
  });

  it("saves the whole set for the signed-in user and returns it", async () => {
    vi.mocked(updateEditorPreferences).mockResolvedValue(true);

    const result = await saveEditorPreferences(preferences);

    expect(result).toEqual({ success: true, data: { preferences } });
    expect(updateEditorPreferences).toHaveBeenCalledWith("user-1", preferences);
  });

  it("reports a miss when the signed-in user's row is gone", async () => {
    vi.mocked(updateEditorPreferences).mockResolvedValue(false);

    const result = await saveEditorPreferences(preferences);

    expect(result).toEqual({ success: false, error: "Couldn't find your account." });
  });

  it("returns a friendly error when the database fails", async () => {
    vi.mocked(updateEditorPreferences).mockRejectedValue(new Error("connection lost"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await saveEditorPreferences(preferences);

    expect(result).toEqual({
      success: false,
      error: "Couldn't save your editor settings. Please try again.",
    });
  });
});
