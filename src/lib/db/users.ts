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

export interface BillingUser {
  id: string;
  email: string;
  name: string | null;
  isPro: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}

// What checkout and the billing portal need to know about the user.
export async function getBillingUser(userId: string): Promise<BillingUser | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      isPro: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
    },
  });
}

// Only fills an empty column, so two concurrent checkouts can't overwrite each
// other's customer.
export async function setStripeCustomerId(userId: string, customerId: string): Promise<boolean> {
  const { count } = await prisma.user.updateMany({
    where: { id: userId, stripeCustomerId: null },
    data: { stripeCustomerId: customerId },
  });

  return count > 0;
}

// updateMany so an event for a customer we don't know (e.g. a deleted account)
// is a quiet no-op rather than a throw that makes Stripe retry for days.
// stripeCustomerId is unique, so this touches at most one row.
export async function activateSubscription(
  customerId: string,
  subscriptionId: string
): Promise<boolean> {
  const { count } = await prisma.user.updateMany({
    where: { stripeCustomerId: customerId },
    data: { isPro: true, stripeSubscriptionId: subscriptionId },
  });

  return count > 0;
}

// Scoped to the subscription the user currently holds, so a late event for an
// old, replaced subscription can't take Pro away.
export async function deactivateSubscription(
  customerId: string,
  subscriptionId: string
): Promise<boolean> {
  const { count } = await prisma.user.updateMany({
    where: { stripeCustomerId: customerId, stripeSubscriptionId: subscriptionId },
    data: { isPro: false, stripeSubscriptionId: null },
  });

  return count > 0;
}
