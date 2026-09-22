import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getItemDetail } from "@/lib/db/items";

function errorResponse(error: string, status: number) {
  return NextResponse.json({ success: false, error }, { status });
}

// Full item detail for the item drawer, fetched when a card is clicked.
export async function GET(_request: Request, { params }: RouteContext<"/api/items/[id]">) {
  // The proxy doesn't cover /api, so the route checks the session itself.
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse("Unauthorized", 401);
  }

  const { id } = await params;

  try {
    const item = await getItemDetail(session.user.id, id);
    if (!item) {
      return errorResponse("Item not found", 404);
    }
    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error("Failed to load item", error);
    return errorResponse("Couldn't load this item. Please try again.", 500);
  }
}
