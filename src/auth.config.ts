import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";

export const SIGN_IN_PATH = "/sign-in";

// Fields the Credentials provider accepts for email/password sign-in.
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
  // Sign-in errors (e.g. OAuthAccountNotLinked) also redirect here with ?error=.
  pages: { signIn: SIGN_IN_PATH },
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
