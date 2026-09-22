import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AccountActions } from "@/components/profile/AccountActions";
import { ItemTypeBreakdown } from "@/components/profile/ItemTypeBreakdown";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { getCollectionStats } from "@/lib/db/collections";
import { getItemStats, getSystemItemTypes } from "@/lib/db/items";
import { getProfileUser } from "@/lib/db/users";
import { requireUserId } from "@/lib/session";

export const metadata: Metadata = { title: "Profile · Devstashy" };

export default async function ProfilePage() {
  const userId = await requireUserId();
  const [user, itemStats, collectionStats, itemTypes] = await Promise.all([
    getProfileUser(userId),
    getItemStats(userId),
    getCollectionStats(userId),
    getSystemItemTypes(userId),
  ]);

  // The session points at a user row that's gone, e.g. a JWT from a deleted account.
  if (!user) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Profile</h1>
        <p className="text-muted-foreground">Your account and what you&apos;ve stashed</p>
      </div>

      <ProfileHeader user={user} />
      <StatsCards stats={{ ...itemStats, ...collectionStats }} />
      <ItemTypeBreakdown itemTypes={itemTypes} />
      <AccountActions hasPassword={user.hasPassword} />
    </div>
  );
}
