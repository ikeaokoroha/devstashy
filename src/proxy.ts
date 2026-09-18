import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import authConfig from "@/auth.config";

// Built from the adapter-free config so the proxy only verifies the session JWT
// and never loads Prisma.
const { auth } = NextAuth(authConfig);

// NextAuth's default sign-in page (no custom pages.signIn is configured).
const SIGN_IN_PATH = "/api/auth/signin";

export const proxy = auth((req) => {
  if (req.auth) return;

  const signInUrl = new URL(SIGN_IN_PATH, req.nextUrl.origin);
  signInUrl.searchParams.set("callbackUrl", req.nextUrl.pathname + req.nextUrl.search);
  return NextResponse.redirect(signInUrl);
});

export const config = {
  matcher: ["/dashboard/:path*"],
};
