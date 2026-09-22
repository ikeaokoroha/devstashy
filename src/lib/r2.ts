import { randomUUID } from "node:crypto";

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Long enough for a 10 MB upload on a slow connection, short enough that a
// leaked URL stops working quickly.
const UPLOAD_URL_TTL_SECONDS = 300;

interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  // No trailing slash; stored file URLs are built from this.
  publicUrl: string;
}

// undefined = not resolved yet, null = not configured, so this only warns once.
let config: R2Config | null | undefined;
let client: S3Client | null | undefined;

function getConfig(): R2Config | null {
  if (config !== undefined) {
    return config;
  }

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) {
    console.warn("R2_* environment variables are not fully set — file uploads are unavailable.");
    config = null;
    return null;
  }

  config = {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucket,
    publicUrl: publicUrl.replace(/\/+$/, ""),
  };
  return config;
}

function getClient(): S3Client | null {
  if (client !== undefined) {
    return client;
  }

  const r2 = getConfig();
  if (!r2) {
    client = null;
    return null;
  }

  client = new S3Client({
    // Required by the SDK, ignored by R2.
    region: "auto",
    endpoint: `https://${r2.accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: r2.accessKeyId, secretAccessKey: r2.secretAccessKey },
    // The SDK adds integrity checksum headers by default from v3.729. They
    // aren't part of a presigned URL's signature, so a browser PUT that doesn't
    // send them fails with an opaque 403 against S3-compatible services.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
  return client;
}

export function isR2Configured(): boolean {
  return getConfig() !== null;
}

// Objects are laid out by owner, so a key says who it belongs to, and named
// randomly, so one upload can never overwrite another or be guessed from a
// filename. The extension is kept for content-type sniffing and tidy URLs.
export function buildObjectKey(userId: string, extension: string): string {
  return `${userId}/${randomUUID()}${extension ? `.${extension}` : ""}`;
}

// Where the stored object is publicly readable, which is what Item.fileUrl holds.
export function getPublicFileUrl(key: string): string | null {
  const r2 = getConfig();
  return r2 ? `${r2.publicUrl}/${key}` : null;
}

// The object a stored file URL points at, or null when the URL isn't one of
// ours. Delete and download both go through this, so a crafted fileUrl can't
// reach an object outside the bucket's public prefix.
export function getObjectKeyFromUrl(fileUrl: string): string | null {
  const r2 = getConfig();
  if (!r2) {
    return null;
  }

  const prefix = `${r2.publicUrl}/`;
  if (!fileUrl.startsWith(prefix)) {
    return null;
  }

  const key = fileUrl.slice(prefix.length);
  return key ? decodeURIComponent(key) : null;
}

// A short-lived URL the browser can PUT the file to directly, bypassing the
// 4.5 MB request body limit on a serverless function. Only the content type is
// signed: a browser can't set Content-Length itself, so signing it risks a
// signature mismatch on every upload.
export async function presignUpload(key: string, contentType: string): Promise<string | null> {
  const s3 = getClient();
  const r2 = getConfig();
  if (!s3 || !r2) {
    return null;
  }

  return getSignedUrl(
    s3,
    new PutObjectCommand({ Bucket: r2.bucket, Key: key, ContentType: contentType }),
    { expiresIn: UPLOAD_URL_TTL_SECONDS }
  );
}

export interface R2Object {
  body: ReadableStream;
  contentType: string | null;
  contentLength: number | null;
}

// The stored object, for the download proxy to stream, or null when it's gone.
export async function getObject(key: string): Promise<R2Object | null> {
  const s3 = getClient();
  const r2 = getConfig();
  if (!s3 || !r2) {
    return null;
  }

  try {
    const result = await s3.send(new GetObjectCommand({ Bucket: r2.bucket, Key: key }));
    if (!result.Body) {
      return null;
    }
    return {
      body: result.Body.transformToWebStream(),
      contentType: result.ContentType ?? null,
      contentLength: result.ContentLength ?? null,
    };
  } catch (error) {
    if (isNotFound(error)) {
      return null;
    }
    throw error;
  }
}

// Best effort: a failed delete leaves an orphaned object, which is cheaper than
// failing the item delete the user asked for.
export async function deleteObject(key: string): Promise<void> {
  const s3 = getClient();
  const r2 = getConfig();
  if (!s3 || !r2) {
    return;
  }

  try {
    await s3.send(new DeleteObjectCommand({ Bucket: r2.bucket, Key: key }));
  } catch (error) {
    console.error(`Failed to delete R2 object ${key}`, error);
  }
}

function isNotFound(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error.name === "NoSuchKey" || error.name === "NotFound")
  );
}
