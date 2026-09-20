import { cache } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { SIGN_IN_PATH } from "@/auth.config";

// The signed-in user's id, for pages and actions that act on the account itself
// rather than on the demo data getCurrentUserId still stands in for.
// Cached per request so a page and its data helpers share one session read.
export const requireUserId = cache(async (): Promise<string> => {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(SIGN_IN_PATH);
  }
  return session.user.id;
});
