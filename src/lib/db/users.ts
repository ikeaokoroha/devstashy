import { prisma } from "@/lib/prisma";
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
