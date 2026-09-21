// Server-side feature flags, read from the environment at startup.

// Turns the whole email verification system off, for when Resend has no
// verified domain and can only deliver to the account owner's address. On
// unless explicitly set to "false", so a typo can't silently disable it.
export const REQUIRE_EMAIL_VERIFICATION =
  process.env.REQUIRE_EMAIL_VERIFICATION?.trim().toLowerCase() !== "false";

// Turns auth rate limiting off, for local work where there's no forwarded IP
// to key on and every request shares one bucket. On unless explicitly set to
// "false", so a typo can't leave production unprotected.
export const RATE_LIMITING_ENABLED = process.env.RATE_LIMITING?.trim().toLowerCase() !== "false";
