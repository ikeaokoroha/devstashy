import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import authConfig, { SIGN_IN_PATH } from "@/auth.config";

// Built from the adapter-free config so the proxy only verifies the session JWT
// and never loads Prisma.
const { auth } = NextAuth(authConfig);

export const proxy = auth((req) => {
  if (req.auth) return;

  const signInUrl = new URL(SIGN_IN_PATH, req.nextUrl.origin);
  signInUrl.searchParams.set("callbackUrl", req.nextUrl.pathname + req.nextUrl.search);
  return NextResponse.redirect(signInUrl);
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/items/:path*",
    "/collections/:path*",
    "/favorites/:path*",
  ],
};
