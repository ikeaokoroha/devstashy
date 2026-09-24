import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AccountActions } from "@/components/settings/AccountActions";
import { getProfileUser } from "@/lib/db/users";
import { requireUserId } from "@/lib/session";

export const metadata: Metadata = { title: "Settings · Devstashy" };

export default async function SettingsPage() {
  const userId = await requireUserId();
  const user = await getProfileUser(userId);

  // The session points at a user row that's gone, e.g. a JWT from a deleted account.
  if (!user) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground">Manage your account</p>
      </div>

      <AccountActions hasPassword={user.hasPassword} />
    </div>
  );
}
