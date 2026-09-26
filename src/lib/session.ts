import { cache } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { SIGN_IN_PATH } from "@/auth.config";

export interface SessionUser {
  id: string;
  isPro: boolean;
}

// The session, cached per request. Every auth() runs the jwt callback's isPro
// query, so the layout, page and actions share this one read rather than each
// calling auth().
export const getSession = cache(() => auth());

// The signed-in user, redirecting to sign-in when there's no session.
export const requireSessionUser = cache(async (): Promise<SessionUser> => {
  const session = await getSession();
  if (!session?.user?.id) {
    redirect(SIGN_IN_PATH);
  }
  return { id: session.user.id, isPro: session.user.isPro };
});

// The signed-in user's id, which scopes every page and action to that user's data.
export const requireUserId = cache(async (): Promise<string> => (await requireSessionUser()).id);
