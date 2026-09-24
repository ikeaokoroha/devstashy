import type { Prisma } from "@/generated/prisma/client";
import {
  DEFAULT_EDITOR_PREFERENCES,
  parseEditorPreferences,
} from "@/lib/editor-preferences";
import { prisma } from "@/lib/prisma";
import type { EditorPreferences } from "@/types/editor";
import type { ProfileUser } from "@/types/profile";

// The account details the profile page shows. `hasPassword` decides whether the
// change password action is offered: OAuth-only users have nothing to change.
export async function getProfileUser(userId: string): Promise<ProfileUser | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      image: true,
      createdAt: true,
      password: true,
      accounts: { select: { provider: true }, orderBy: { provider: "asc" } },
    },
  });

  if (!user) {
    return null;
  }

  const { password, accounts, ...profile } = user;
  return {
    ...profile,
    hasPassword: password !== null,
    providers: accounts.map((account) => account.provider),
  };
}

// The signed-in user's editor settings, for the app shell. A missing row or an
// unset column reads as the defaults, so no caller has to handle null.
export async function getEditorPreferences(userId: string): Promise<EditorPreferences> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { editorPreferences: true },
  });

  if (!user) {
    return DEFAULT_EDITOR_PREFERENCES;
  }

  return parseEditorPreferences(user.editorPreferences);
}

// Scoped with updateMany on the id so a missing row is a false rather than a throw,
// the way the item and collection writes report a miss.
export async function updateEditorPreferences(
  userId: string,
  preferences: EditorPreferences
): Promise<boolean> {
  // Written field by field rather than cast to Prisma's JSON input type, so only
  // these five keys can ever reach the column.
  const value: Prisma.InputJsonObject = {
    fontSize: preferences.fontSize,
    tabSize: preferences.tabSize,
    wordWrap: preferences.wordWrap,
    minimap: preferences.minimap,
    theme: preferences.theme,
  };

  const { count } = await prisma.user.updateMany({
    where: { id: userId },
    data: { editorPreferences: value },
  });

  return count > 0;
}
