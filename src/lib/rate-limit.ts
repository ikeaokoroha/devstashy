import { Ratelimit, type Duration } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";

import { RATE_LIMITING_ENABLED } from "@/lib/feature-flags";

// Sliding window limits for the auth flows, keyed as described per call site.
// Windows use @upstash/ratelimit's duration strings ("15 m", "1 h").
const RATE_LIMITS = {
  signIn: { limit: 5, window: "15 m" },
  register: { limit: 3, window: "1 h" },
  forgotPassword: { limit: 3, window: "1 h" },
  resetPassword: { limit: 5, window: "15 m" },
  resendVerification: { limit: 3, window: "15 m" },
} as const satisfies Record<string, { limit: number; window: Duration }>;

export type RateLimitName = keyof typeof RATE_LIMITS;

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  // Unix timestamp in milliseconds when the window resets; 0 when not limited.
  reset: number;
}

// Requests are allowed through when Upstash is unreachable or unconfigured, so
// a limiter outage can't lock everyone out of signing in.
function allow(name: RateLimitName): RateLimitResult {
  return { success: true, remaining: RATE_LIMITS[name].limit, reset: 0 };
}

// Redis rejects a slow connection rather than holding the request open; the
// check then fails open through the timeout reason below.
const REDIS_TIMEOUT_MS = 1_000;

// undefined = not resolved yet, null = no credentials, so this only warns once.
let redisClient: Redis | null | undefined;

function getRedis(): Redis | null {
  if (redisClient !== undefined) {
    return redisClient;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    console.warn(
      "UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is not set — auth rate limiting is disabled.",
    );
    redisClient = null;
    return null;
  }

  redisClient = new Redis({ url, token });
  return redisClient;
}

const limiters = new Map<RateLimitName, Ratelimit>();

function getLimiter(name: RateLimitName): Ratelimit | null {
  // Ahead of the credentials check, so turning limiting off doesn't warn about
  // an Upstash setup it isn't going to use.
  if (!RATE_LIMITING_ENABLED) {
    return null;
  }

  const cached = limiters.get(name);
  if (cached) {
    return cached;
  }

  const redis = getRedis();
  if (!redis) {
    return null;
  }

  const { limit, window } = RATE_LIMITS[name];
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, window),
    // Namespaced per limit so the five flows count separately.
    prefix: `devstash:rl:${name}`,
    timeout: REDIS_TIMEOUT_MS,
    analytics: false,
  });
  limiters.set(name, limiter);
  return limiter;
}

// Consumes one attempt and reports whether it was within the limit.
export async function checkRateLimit(
  name: RateLimitName,
  identifier: string,
): Promise<RateLimitResult> {
  const limiter = getLimiter(name);
  if (!limiter) {
    return allow(name);
  }

  try {
    const { success, remaining, reset } = await limiter.limit(identifier);
    return { success, remaining, reset };
  } catch (error) {
    console.error(`Rate limit check failed for ${name}`, error);
    return allow(name);
  }
}

// Clears the attempts counted against an identifier, so a limit that counts
// attempts only holds failures against the user.
export async function resetRateLimit(name: RateLimitName, identifier: string): Promise<void> {
  const limiter = getLimiter(name);
  if (!limiter) {
    return;
  }

  try {
    await limiter.resetUsedTokens(identifier);
  } catch (error) {
    console.error(`Failed to reset rate limit for ${name}`, error);
  }
}

const FALLBACK_IP = "127.0.0.1";

// Vercel sets x-vercel-forwarded-for and x-real-ip itself, so they can't be
// spoofed by the client the way a self-appended x-forwarded-for entry can.
// Falls back to the leftmost x-forwarded-for entry for other hosts, and to a
// constant locally, where every request shares one bucket.
export function getClientIp(headerList: Headers): string {
  const trusted = headerList.get("x-vercel-forwarded-for") ?? headerList.get("x-real-ip");
  if (trusted?.trim()) {
    return trusted.trim();
  }

  const forwarded = headerList.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || FALLBACK_IP;
}

// For server actions and other places with no request object to hand.
export async function getRequestIp(): Promise<string> {
  try {
    return getClientIp(await headers());
  } catch (error) {
    console.error("Could not read request headers for the client IP", error);
    return FALLBACK_IP;
  }
}

const MINUTE_MS = 60_000;

// Seconds until the window resets, for the Retry-After header.
export function retryAfterSeconds(reset: number): number {
  return Math.max(1, Math.ceil((reset - Date.now()) / 1000));
}

export function rateLimitMessage(reset: number): string {
  const minutes = Math.max(1, Math.ceil((reset - Date.now()) / MINUTE_MS));
  return `Too many attempts. Please try again in ${minutes} ${minutes === 1 ? "minute" : "minutes"}.`;
}
