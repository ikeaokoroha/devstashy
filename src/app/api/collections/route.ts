import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getPickerCollections } from "@/lib/db/collections";

function errorResponse(error: string, status: number) {
  return NextResponse.json({ success: false, error }, { status });
}

// The user's collections for the item forms' picker, fetched when a form opens.
export async function GET() {
  // The proxy doesn't cover /api, so the route checks the session itself.
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse("Unauthorized", 401);
  }

  try {
    const collections = await getPickerCollections(session.user.id);
    return NextResponse.json({ success: true, data: collections });
  } catch (error) {
    console.error("Failed to load collections", error);
    return errorResponse("Couldn't load your collections. Please try again.", 500);
  }
}
