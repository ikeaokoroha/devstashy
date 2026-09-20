// Server-side feature flags, read from the environment at startup.

// Turns the whole email verification system off, for when Resend has no
// verified domain and can only deliver to the account owner's address. On
// unless explicitly set to "false", so a typo can't silently disable it.
export const REQUIRE_EMAIL_VERIFICATION =
  process.env.REQUIRE_EMAIL_VERIFICATION?.trim().toLowerCase() !== "false";
