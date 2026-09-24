import { describe, expect, it, vi } from "vitest";

import { getEditorPreferences, updateEditorPreferences } from "@/lib/db/users";
import { DEFAULT_EDITOR_PREFERENCES } from "@/lib/editor-preferences";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

const preferences = {
  fontSize: 14,
  tabSize: 4,
  wordWrap: false,
  minimap: true,
  theme: "monokai",
} as const;

describe("getEditorPreferences", () => {
  it("reads only the preferences column, for the given user", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      editorPreferences: preferences,
    } as never);

    expect(await getEditorPreferences("user-1")).toEqual(preferences);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: "user-1" },
      select: { editorPreferences: true },
    });
  });

  it("returns the defaults when the column has never been set", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ editorPreferences: null } as never);

    expect(await getEditorPreferences("user-1")).toEqual(DEFAULT_EDITOR_PREFERENCES);
  });

  it("returns the defaults when the row is gone, rather than throwing", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null as never);

    expect(await getEditorPreferences("user-1")).toEqual(DEFAULT_EDITOR_PREFERENCES);
  });

  it("repairs a stored value that no longer fits the options", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      editorPreferences: { ...preferences, theme: "dracula" },
    } as never);

    expect(await getEditorPreferences("user-1")).toEqual({
      ...preferences,
      theme: DEFAULT_EDITOR_PREFERENCES.theme,
    });
  });
});

describe("updateEditorPreferences", () => {
  it("writes the five preference keys, scoped to the user", async () => {
    vi.mocked(prisma.user.updateMany).mockResolvedValue({ count: 1 } as never);

    expect(await updateEditorPreferences("user-1", preferences)).toBe(true);
    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { editorPreferences: { ...preferences } },
    });
  });

  it("stores nothing beyond the known keys", async () => {
    vi.mocked(prisma.user.updateMany).mockResolvedValue({ count: 1 } as never);

    await updateEditorPreferences("user-1", { ...preferences, isPro: true } as never);

    const [call] = vi.mocked(prisma.user.updateMany).mock.calls;
    expect(call[0].data.editorPreferences).toEqual(preferences);
  });

  it("is false when no row matched", async () => {
    vi.mocked(prisma.user.updateMany).mockResolvedValue({ count: 0 } as never);

    expect(await updateEditorPreferences("user-1", preferences)).toBe(false);
  });
});
