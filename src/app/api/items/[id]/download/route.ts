import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getItemFile } from "@/lib/db/items";
import { getObject, getObjectKeyFromUrl } from "@/lib/r2";

function errorResponse(error: string, status: number) {
  return NextResponse.json({ success: false, error }, { status });
}

// Header values can't carry quotes, backslashes or anything outside printable
// ASCII without breaking the header, so the plain filename is reduced to a safe
// approximation and the real one goes in the RFC 5987 form browsers prefer.
function contentDisposition(fileName: string): string {
  const fallback = fileName.replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "_");
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

// Streams the item's file back through our own origin, so the browser saves it
// under its original name instead of navigating to the R2 URL.
export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/items/[id]/download">
) {
  // The proxy doesn't cover /api, so the route checks the session itself.
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse("Unauthorized", 401);
  }

  const { id } = await params;

  try {
    const file = await getItemFile(session.user.id, id);
    if (!file) {
      return errorResponse("File not found", 404);
    }

    // Anything not in our bucket is treated as missing rather than fetched.
    const key = getObjectKeyFromUrl(file.fileUrl);
    if (!key) {
      return errorResponse("File not found", 404);
    }

    const object = await getObject(key);
    if (!object) {
      return errorResponse("File not found", 404);
    }

    return new NextResponse(object.body, {
      headers: {
        "Content-Type": object.contentType ?? "application/octet-stream",
        "Content-Disposition": contentDisposition(file.fileName),
        ...(object.contentLength !== null && {
          "Content-Length": String(object.contentLength),
        }),
        // The file is the user's own; a shared cache must never hold it.
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("Failed to download item file", error);
    return errorResponse("Couldn't download this file. Please try again.", 500);
  }
}
