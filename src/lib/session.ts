import { cache } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { SIGN_IN_PATH } from "@/auth.config";

// The signed-in user's id, which scopes every page and action to that user's data.
// Cached per request so a page and its data helpers share one session read.
export const requireUserId = cache(async (): Promise<string> => {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(SIGN_IN_PATH);
  }
  return session.user.id;
});
