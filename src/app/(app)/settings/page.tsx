import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AccountActions } from "@/components/settings/AccountActions";
import { BillingCard, type CheckoutResult } from "@/components/settings/BillingCard";
import { EditorPreferencesCard } from "@/components/settings/EditorPreferencesCard";
import { countCollections } from "@/lib/db/collections";
import { countItems } from "@/lib/db/items";
import { getProfileUser } from "@/lib/db/users";
import { requireSessionUser } from "@/lib/session";

export const metadata: Metadata = { title: "Settings · Devstashy" };

function getCheckoutResult(value: string | string[] | undefined): CheckoutResult | undefined {
  const param = Array.isArray(value) ? value[0] : value;
  return param === "success" || param === "canceled" ? param : undefined;
}

export default async function SettingsPage({ searchParams }: PageProps<"/settings">) {
  // isPro comes from the session, which the jwt callback re-reads from the
  // column on every request, so it already reflects the latest webhook.
  const { id: userId, isPro } = await requireSessionUser();
  const [user, items, collections, params] = await Promise.all([
    getProfileUser(userId),
    countItems(userId),
    countCollections(userId),
    searchParams,
  ]);

  // The session points at a user row that's gone, e.g. a JWT from a deleted account.
  if (!user) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and plan</p>
      </div>

      {/* Reads the preferences from the shell's provider, so the page needs no
          query of its own and a change reaches every open editor. */}
      <EditorPreferencesCard />

      <BillingCard
        isPro={isPro}
        usage={{ items, collections }}
        checkout={getCheckoutResult(params.checkout)}
      />

      <AccountActions hasPassword={user.hasPassword} />
    </div>
  );
}
