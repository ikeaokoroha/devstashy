import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";

// Edge-compatible config shared by the proxy and the full instance in auth.ts:
// providers and callbacks only, no database adapter.
export default {
  providers: [GitHub],
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
