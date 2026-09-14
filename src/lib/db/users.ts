import { cache } from "react";
import { prisma } from "@/lib/prisma";

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
