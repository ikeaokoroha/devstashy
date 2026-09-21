import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth, { type User } from "next-auth";
import Credentials from "next-auth/providers/credentials";

import authConfig, { CREDENTIALS_FIELDS } from "@/auth.config";
import { EmailNotVerifiedError, TooManyAttemptsError } from "@/lib/auth-errors";
import { signInSchema } from "@/lib/auth-validation";
import { REQUIRE_EMAIL_VERIFICATION } from "@/lib/feature-flags";
import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getRequestIp, resetRateLimit } from "@/lib/rate-limit";

// Returns the user when the email has a password and it matches; null makes
// Auth.js reject the sign-in without saying which part was wrong. A correct
// password on an unverified email gets its own error so the user can be told.
//
// The rate limit lives here rather than in the sign-in action because a brute
// force attempt posts straight to the credentials callback and never touches
// the action.
async function authorizeCredentials(credentials: unknown): Promise<User | null> {
  const parsed = signInSchema.safeParse(credentials);
  if (!parsed.success) {
    return null;
  }
  const { email, password } = parsed.data;

  // Keyed by IP and email together, so one attacker can't lock a victim out of
  // their own account from elsewhere, and a botnet can't spread attempts on one
  // account across addresses for free.
  const rateLimitKey = `${await getRequestIp()}:${email}`;
  const rateLimit = await checkRateLimit("signIn", rateLimitKey);
  if (!rateLimit.success) {
    throw new TooManyAttemptsError(rateLimit.reset);
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, image: true, password: true, emailVerified: true },
  });
  if (!user?.password) {
    return null;
  }

  const isValid = await verifyPassword(password, user.password);
  if (!isValid) {
    return null;
  }
  if (REQUIRE_EMAIL_VERIFICATION && !user.emailVerified) {
    throw new EmailNotVerifiedError();
  }

  // Signing in clears the counter, so the limit only ever holds failed attempts
  // against someone who then gets their password right.
  await resetRateLimit("signIn", rateLimitKey);

  return { id: user.id, name: user.name, email: user.email, image: user.image };
}

// Full instance: the Prisma adapter persists users and accounts, while sessions
// stay in a JWT so the proxy can verify them without a database call.
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  ...authConfig,
  providers: authConfig.providers.map((provider) =>
    typeof provider !== "function" && provider.id === "credentials"
      ? Credentials({ credentials: CREDENTIALS_FIELDS, authorize: authorizeCredentials })
      : provider,
  ),
});
