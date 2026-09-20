import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth, { type User } from "next-auth";
import Credentials from "next-auth/providers/credentials";

import authConfig, { CREDENTIALS_FIELDS } from "@/auth.config";
import { EmailNotVerifiedError } from "@/lib/auth-errors";
import { signInSchema } from "@/lib/auth-validation";
import { REQUIRE_EMAIL_VERIFICATION } from "@/lib/feature-flags";
import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

// Returns the user when the email has a password and it matches; null makes
// Auth.js reject the sign-in without saying which part was wrong. A correct
// password on an unverified email gets its own error so the user can be told.
async function authorizeCredentials(credentials: unknown): Promise<User | null> {
  const parsed = signInSchema.safeParse(credentials);
  if (!parsed.success) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, name: true, email: true, image: true, password: true, emailVerified: true },
  });
  if (!user?.password) {
    return null;
  }

  const isValid = await verifyPassword(parsed.data.password, user.password);
  if (!isValid) {
    return null;
  }
  if (REQUIRE_EMAIL_VERIFICATION && !user.emailVerified) {
    throw new EmailNotVerifiedError();
  }

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
