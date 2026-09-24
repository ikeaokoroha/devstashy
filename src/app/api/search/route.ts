import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getSearchCollections } from "@/lib/db/collections";
import { getSearchItems } from "@/lib/db/items";

// Bounds on what the palette holds in memory. Matching runs in the browser, so
// a user past these caps searches their most recent work rather than all of it.
const SEARCH_ITEMS_LIMIT = 500;
const SEARCH_COLLECTIONS_LIMIT = 200;

function errorResponse(error: string, status: number) {
  return NextResponse.json({ success: false, error }, { status });
}

// Everything the command palette searches, fetched once when the shell mounts
// and again each time the palette opens.
export async function GET() {
  // The proxy doesn't cover /api, so the route checks the session itself.
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse("Unauthorized", 401);
  }

  try {
    const [items, collections] = await Promise.all([
      getSearchItems(session.user.id, SEARCH_ITEMS_LIMIT),
      getSearchCollections(session.user.id, SEARCH_COLLECTIONS_LIMIT),
    ]);

    return NextResponse.json({ success: true, data: { items, collections } });
  } catch (error) {
    console.error("Failed to load search data", error);
    return errorResponse("Couldn't load your search results. Please try again.", 500);
  }
}
