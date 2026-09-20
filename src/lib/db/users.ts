import { cache } from "react";
import { prisma } from "@/lib/prisma";
import type { ProfileUser } from "@/types/profile";

// Placeholder until authentication is in place: every query is scoped to the seeded demo user.
// Replace with the signed-in user's id from the session.
const DEMO_USER_EMAIL = "demo@devstash.io";

// Cached per request: the dashboard layout and page both need it.
export const getCurrentUserId = cache(async (): Promise<string> => {
  const user = await prisma.user.findUnique({
    where: { email: DEMO_USER_EMAIL },
    select: { id: true },
  });

  if (!user) {
    throw new Error(`Demo user ${DEMO_USER_EMAIL} not found. Run \`npx prisma db seed\`.`);
  }

  return user.id;
});

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
