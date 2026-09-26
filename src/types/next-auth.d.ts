import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      isPro: boolean;
    } & DefaultSession["user"];
  }
}

// Augmented at the source: next-auth/jwt only re-exports this module, and an
// augmentation of the re-export doesn't reach the JWT the callbacks receive.
declare module "@auth/core/jwt" {
  interface JWT {
    isPro?: boolean;
  }
}
