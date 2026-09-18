import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";

// Fields the default sign-in page renders for email/password sign-in.
export const CREDENTIALS_FIELDS = {
  email: { label: "Email", type: "email" },
  password: { label: "Password", type: "password" },
};

// Edge-compatible config shared by the proxy and the full instance in auth.ts:
// providers and callbacks only, no database adapter.
export default {
  providers: [
    GitHub,
    // Placeholder: checking a password needs bcrypt and Prisma, so auth.ts
    // swaps in the real authorize.
    Credentials({ credentials: CREDENTIALS_FIELDS, authorize: () => null }),
  ],
  callbacks: {
    // With the JWT strategy the token's `sub` holds the user's database id.
    session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
