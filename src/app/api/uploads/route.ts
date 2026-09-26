import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { validateUpload } from "@/lib/file-upload";
import { buildObjectKey, getPublicFileUrl, isR2Configured, presignUpload } from "@/lib/r2";
import { hasProAccess, PLAN_ERRORS } from "@/lib/usage-limits";

// Long file names are kept for display but capped so one can't bloat every row.
const presignSchema = z.object({
  typeName: z.string(),
  fileName: z.string().trim().min(1).max(255),
  size: z.number().int().positive(),
  mimeType: z.string().max(255),
});

function errorResponse(error: string, status: number) {
  return NextResponse.json({ success: false, error }, { status });
}

// Mints a short-lived URL the browser PUTs the file straight to R2 with, so the
// bytes never pass through this function and aren't capped at 4.5 MB.
export async function POST(request: Request) {
  // The proxy doesn't cover /api, so the route checks the session itself.
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse("Unauthorized", 401);
  }

  // Uploads are what cost R2 storage, so this is the gate that matters most;
  // the item type check in createItem only stops the row being saved.
  if (!hasProAccess(session.user.isPro)) {
    return errorResponse(PLAN_ERRORS.uploads, 403);
  }

  if (!isR2Configured()) {
    return errorResponse("File uploads aren't available right now.", 503);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid request.", 400);
  }

  const parsed = presignSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("Invalid request.", 400);
  }

  // The browser checks this too, for immediate feedback; this is the one that counts.
  const validation = validateUpload(parsed.data);
  if (!validation.ok) {
    return errorResponse(validation.error, 400);
  }

  const key = buildObjectKey(session.user.id, validation.extension);
  const fileUrl = getPublicFileUrl(key);

  try {
    const uploadUrl = await presignUpload(key, validation.contentType);
    if (!uploadUrl || !fileUrl) {
      return errorResponse("File uploads aren't available right now.", 503);
    }

    return NextResponse.json({
      success: true,
      data: {
        uploadUrl,
        // Sent back with the PUT: the signature covers this exact value.
        contentType: validation.contentType,
        // What the item stores once the upload finishes.
        fileUrl,
        fileName: parsed.data.fileName,
        fileSize: parsed.data.size,
      },
    });
  } catch (error) {
    console.error("Failed to sign an upload URL", error);
    return errorResponse("Couldn't start this upload. Please try again.", 500);
  }
}
