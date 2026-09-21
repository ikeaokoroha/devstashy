# Auth Security Review

**Last audited:** 2026-09-21
**Scope:** NextAuth v5 credentials + GitHub, email verification, password reset, profile account actions
**Files reviewed:** 42

## Summary

The token-handling layer is in good shape: verification and reset tokens are 256-bit
`randomBytes`, stored only as SHA-256 hashes, namespaced apart, expiry-checked at
consumption, and deleted inside the same transaction that applies the account change.
Password hashing is centralized at bcrypt-12 and every write path uses it; the profile
actions resolve the user from the session and never from form input. The gap is
everything around abuse control: there is no rate limiting of any kind on any auth
endpoint, and the registration endpoint hands out a clean registered/not-registered
oracle that the rest of the code goes out of its way to avoid.

**1 High, 1 Medium, 1 Low.**

## Findings

### High

#### No rate limiting on any authentication endpoint

- **Location:** `src/actions/auth.ts:41` (`signInWithCredentials`), `src/app/api/auth/register/route.ts:16` (`POST`), `src/actions/auth.ts:101` (`requestPasswordReset`), `src/actions/auth.ts:76` (`resendVerificationEmail`), `src/actions/auth.ts:125` (`resetPassword`)
- **Issue:** Nothing in the codebase counts or throttles authentication attempts. A
  repo-wide search for rate limiting turns up no implementation and no dependency
  (`package.json` has no `@upstash/ratelimit` or equivalent), and `src/proxy.ts:18-20`
  only matches `/dashboard/:path*` and `/profile/:path*`, so no auth endpoint passes
  through it at all. `authorizeCredentials` (`src/auth.ts:15-38`) goes straight from a
  zod parse to a `findUnique` to `verifyPassword` with no attempt counter, no lockout,
  no backoff and no captcha. Auth.js does not supply this itself — its credentials
  provider is documented as leaving brute-force protection to the application.

  The per-email cooldowns that do exist — `RESEND_COOLDOWN_MS` at
  `src/lib/password-reset.ts:16` and `src/lib/email-verification.ts:13`, enforced by
  `wasTokenIssuedRecently` (`src/lib/auth-tokens.ts:52-61`) — throttle *mail volume* to
  one address. They are not attempt limits: they do not slow password guessing, they
  are keyed per email rather than per IP, and an attacker rotating target addresses
  never touches them.
- **Attack:** An attacker who has a credential-stuffing list (or one target email and a
  password dictionary) can POST the sign-in server action as fast as the server will
  answer. Nothing records the failures, so there is no lockout and no signal to the
  user; bcrypt-12 costs roughly a quarter-second of server CPU per guess, but the
  attacker parallelizes across connections, so a few hundred concurrent requests yield
  thousands of guesses per hour against a chosen account while simultaneously saturating
  the server's CPU with bcrypt work — a denial-of-service on every other request at the
  same time. The same absence lets an attacker create unlimited accounts through
  `/api/auth/register` and drive unlimited Resend sends by cycling addresses through
  `requestPasswordReset`, which burns the mail quota and can get the sending domain
  flagged.
- **Fix:** Add a per-IP attempt limiter in front of the credentials path and the
  unauthenticated routes, keyed on IP and separately on a hash of the submitted email,
  failing closed on the sign-in path. `src/proxy.ts` runs on the Node.js runtime in
  Next.js 16, so it can host the check — extend the matcher to cover
  `/api/auth/:path*` and short-circuit over the limit:

  ```ts
  // src/proxy.ts
  export const config = {
    matcher: ["/dashboard/:path*", "/profile/:path*", "/api/auth/:path*"],
  };
  ```

  Back it with a shared store (Upstash Redis, or Postgres if Redis stays out of scope) —
  an in-process counter resets on every serverless cold start and is not shared between
  instances, so it is not a real limit. A sliding window of roughly 5 attempts per
  15 minutes per IP/email on sign-in, and 5 per hour on register, forgot-password and
  resend, matches normal use without hurting real users. Lay the same limiter on
  `changePassword` (`src/actions/profile.ts:20`), which currently allows unlimited
  current-password guessing within a session.

### Medium

#### Registration discloses whether an email address has an account

- **Location:** `src/app/api/auth/register/route.ts:31-34`

  ```ts
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    return errorResponse(EMAIL_TAKEN_ERROR, 409);
  }
  ```

- **Issue:** `POST /api/auth/register` is unauthenticated and returns a 409 with
  "An account with this email already exists" for a registered address and a 201 for an
  unregistered one. That is a clean, machine-readable oracle, and it undoes the uniform
  responses the rest of the auth surface deliberately pays for:
  `sendPasswordResetLink` returns silently for unknown and OAuth-only emails
  (`src/lib/password-reset.ts:36-40`), `resendVerificationLink` does the same
  (`src/lib/email-verification.ts:44-57`), and both actions answer with the same
  "if an account exists" message either way (`src/components/auth/ForgotPasswordForm.tsx:13-20`,
  `src/components/auth/ResendVerificationForm.tsx:18-24`).

  A second, weaker oracle sits on the same surface: `requestPasswordReset`
  (`src/actions/auth.ts:101-117`) returns after a single fast `SELECT` for an unknown
  address but waits on a Resend HTTP round-trip for a registered one, so the response
  time separates the two cases even though the message does not.
- **Attack:** An attacker who has a list of candidate addresses — a company's employee
  directory, or a breach dump they want to narrow — can POST each one to
  `/api/auth/register` and read 409 vs 201 to learn exactly which addresses have
  DevStash accounts. With no rate limit (High finding above) this runs at full speed
  over the whole list. The confirmed accounts then become the target set for credential
  stuffing or for a phishing mail that names the service the victim actually uses. Worse,
  the probe itself is not read-only: every unregistered address the attacker tests gets a
  real account created under their password, so a probe against `victim@company.com`
  that returns 201 has just squatted that address — the real owner is then locked out of
  registering it, and of GitHub sign-in, which returns `OAuthAccountNotLinked`
  (`src/app/(auth)/sign-in/page.tsx:15-17`).
- **Fix:** Stop branching the response on existence. Return 201 with the same body for
  both cases and move the "this email is taken" news into the mailbox: when the address
  is already registered, send a "someone tried to register with your address — sign in
  or reset your password instead" email rather than creating a row, and when it is not,
  proceed as now. That keeps the UX (the user learns what happened, in the one place only
  the address owner can read) while making the HTTP response identical. This requires
  `REQUIRE_EMAIL_VERIFICATION` to be on, so it pairs with turning the flag back on once
  a Resend domain is verified. If the endpoint must keep the 409 in the meantime, the
  per-IP limiter from the High finding is what bounds the damage — say so in the code
  comment so the tradeoff is explicit. For the timing oracle, move the Resend call off
  the request path (or `await` a fixed floor) so both branches take the same time.

### Low

#### Account deletion is not re-authenticated

- **Location:** `src/actions/profile.ts:79-99`

  ```ts
  const userId = await requireUserId();

  if (formData.get("confirmation") !== DELETE_CONFIRMATION) {
    return { success: false, error: `Type ${DELETE_CONFIRMATION} to confirm.` };
  }
  await prisma.user.delete({ where: { id: userId } });
  ```

- **Issue:** `deleteAccount` is correctly scoped to the session user and does require a
  typed confirmation, but the confirmation is a fixed literal (`DELETE`,
  `src/lib/profile.ts:4`) that anyone holding the session already knows. It proves
  intent, not identity. `changePassword` in the same file re-verifies the current
  password before writing (`src/actions/profile.ts:55-61`), so the codebase already has
  the pattern; the irreversible action is the one missing it. This is the asymmetry
  worth closing, not the absence of confirmation.
- **Attack:** An attacker who holds a session JWT for the account — a token lifted from a
  shared or unlocked machine, or one issued *before* the victim reset their password,
  which stays valid under the known JWT gap below — cannot change the password, because
  that path demands the current one. They can, however, call `deleteAccount` with
  `confirmation=DELETE` and permanently destroy the account along with every item,
  collection and custom type, all of which cascade from `User`
  (`prisma/schema.prisma:53`, `:106`, `:129`, `:149`). The victim's own remediation —
  resetting their password — does not close the window.
- **Fix:** Require the current password in the delete form for accounts that have one,
  verified server side the way `changePassword` does, and keep the typed `DELETE` as the
  intent check:

  ```ts
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { password: true },
  });
  if (user?.password && !(await verifyPassword(String(formData.get("password") ?? ""), user.password))) {
    return { success: false, error: "That's not your current password" };
  }
  ```

  OAuth-only accounts (`hasPassword === false`, already threaded through
  `AccountActions`) have no password to check, so gate on `hasPassword` and leave the
  typed confirmation as their only barrier until a re-auth flow exists for them.

## Passed Checks

- **Password hashing is centralized at bcrypt-12** — `hashPassword`/`verifyPassword`
  (`src/lib/password.ts:3-11`) are the only callers of `bcryptjs` in the app, and all
  three write paths use them: registration (`src/app/api/auth/register/route.ts:40`),
  reset (`src/lib/password-reset.ts:89`) and change (`src/actions/profile.ts:65`). No
  path hashes at a different cost or stores a plaintext password.
- **The password hash never leaves the server** — `authorizeCredentials` selects
  `password` but returns only `{id, name, email, image}` (`src/auth.ts:37`), and
  `getProfileUser` destructures the hash off before returning, exposing only the boolean
  `hasPassword` (`src/lib/db/users.ts:42-47`). Nothing logs credentials: every
  `console.error` in the auth paths logs an error object, never form data.
- **Sign-in failures are indistinguishable** — `authorizeCredentials` returns `null` for
  a parse failure, an unknown email, an OAuth-only account and a wrong password alike
  (`src/auth.ts:17-32`), and the action maps every `CredentialsSignin` to one string,
  "Invalid email or password" (`src/actions/auth.ts:63-68`). The unverified-email error
  is thrown only *after* the password matches (`src/auth.ts:33-35`, and the comment at
  `src/lib/auth-errors.ts:3-4`), so it cannot be used to probe for registered addresses.
- **Tokens are 256-bit and stored hashed** — `issueToken` generates
  `randomBytes(32).toString("hex")` and writes only `hashToken(token)`
  (`src/lib/auth-tokens.ts:34-40`), and every lookup is by hash
  (`src/lib/password-reset.ts:30`, `src/lib/email-verification.ts:60`). A dump of
  `VerificationToken` yields nothing usable.
- **Both token types are expiry-checked at consumption, not just at issue** —
  `checkPasswordResetToken` (`src/lib/password-reset.ts:71-74`) and `verifyEmailToken`
  (`src/lib/email-verification.ts:68-71`) compare `record.expires` against the current
  time on every use and delete the row when stale, so an expired token in an inbox is
  dead regardless of how it is replayed.
- **Reset tokens live 1 hour, verification tokens 24 hours** —
  `src/lib/password-reset.ts:14` vs `src/lib/email-verification.ts:11`. The
  account-handover token is proportionately shorter-lived, as it should be.
- **Reset tokens are single-use under concurrency** — `resetPasswordWithToken` deletes
  the token inside the interactive transaction *before* writing the password and bails
  when `count === 0` (`src/lib/password-reset.ts:92-97`). Under Postgres read-committed,
  a second concurrent submit blocks on the row lock and then finds nothing to delete, so
  only one of two racing submissions can set a password. `verifyEmailToken` uses the
  identical pattern (`src/lib/email-verification.ts:74-79`). The Neon adapter is the
  WebSocket driver (`src/lib/prisma.ts:9`), which supports interactive transactions.
- **The two token kinds cannot substitute for each other** — reset tokens are stored
  under `password-reset:${email}` (`src/lib/password-reset.ts:26`) and verification
  tokens under the bare email (`src/lib/email-verification.ts:22`). The namespace cannot
  be forged from the other side either: `emailSchema` (`src/lib/auth-validation.ts:9`)
  rejects `password-reset:victim@example.com` as an address, so no user row can carry an
  email that collides with a reset identifier.
- **Link origins come from configuration, never the request** — `getAppUrl`
  (`src/lib/auth-tokens.ts:21-29`) reads `APP_URL`, falls back to localhost only outside
  production, and throws in production when unset. Both links are built from it
  (`src/lib/password-reset.ts:43`, `src/lib/email-verification.ts:28`), so a spoofed
  `Host` header cannot redirect a live token to an attacker's domain. The tokens are
  also safe from HTML injection in the mail body: `URLSearchParams` percent-encodes the
  email before it reaches the `href` in `sendActionEmail` (`src/lib/email.ts:43`).
- **A failed send does not leave a live token or a false cooldown** — both flows revoke
  the token they just issued when Resend throws (`src/lib/password-reset.ts:47-54`,
  `src/lib/email-verification.ts:32-39`), so the 60-second cooldown cannot swallow the
  retry the user is told to make.
- **Issuing a token invalidates the previous one** — `issueToken` runs a `deleteMany` on
  the identifier in the same transaction as the insert (`src/lib/auth-tokens.ts:35-40`),
  so only the newest link in a mailbox works.
- **Account mutations resolve the user from the session only** — `changePassword` and
  `deleteAccount` both open with `await requireUserId()`
  (`src/actions/profile.ts:24`, `:80`), which reads `auth()` and redirects when there is
  no session (`src/lib/session.ts:10-16`). Neither reads a user id from form data, and
  both Prisma writes are keyed `where: { id: userId }` (`src/actions/profile.ts:64`,
  `:90`), so neither can touch another row.
- **`changePassword` re-checks server side rather than trusting the UI** — it verifies
  the current password with bcrypt and rejects OAuth-only accounts
  (`src/actions/profile.ts:51-61`) even though `AccountActions` already hides the dialog
  when `hasPassword` is false (`src/components/profile/AccountActions.tsx:22`). Forging
  the server-action POST gains nothing.
- **The reset transaction cannot create a password on an OAuth-only account** — the
  update is guarded `where: { email, password: { not: null } }`
  (`src/lib/password-reset.ts:100-103`), so an account that dropped its password between
  the request and the submit ends the flow as "invalid" rather than gaining one.
- **Protected routes are covered twice** — `src/proxy.ts:19` matches
  `/dashboard/:path*` and `/profile/:path*`, which in Next.js path syntax includes the
  bare `/dashboard` and `/profile`; those are the only two routes in the `(app)` group.
  Independently, `AppLayout` calls `auth()` and redirects when there is no session
  (`src/app/(app)/layout.tsx:24-26`), so a matcher gap alone would not expose a page.
- **`REQUIRE_EMAIL_VERIFICATION` fails closed** — `src/lib/feature-flags.ts:6-7` is on
  unless the value is exactly `"false"` after trim and lowercase, so a typo, an empty
  string or a missing variable leaves verification enabled. The parsing matches what the
  comment claims.
- **Password rules are shared by every path that sets a password** — `newPasswordSchema`
  (`src/lib/auth-validation.ts:11-14`, 8–72 with a confirm match) is reused by
  `registerSchema`, `resetPasswordSchema` and `changePasswordSchema`
  (`src/lib/auth-validation.ts:35`, `:44`, `:53`), so no path accepts a password the
  others would reject. The 72 bound is counted in characters rather than bytes, so a
  password of multi-byte characters can still be truncated by bcrypt — not exploitable,
  since 72 bytes is far past any useful keyspace, but the comment at `:3-4` overstates
  the guarantee slightly.
- **Client-side validation is backed by the same server-side schema** — `RegisterForm`
  parses with `registerSchema` before posting (`src/components/auth/RegisterForm.tsx:26`),
  and the route re-parses the body with the same schema
  (`src/app/api/auth/register/route.ts:24`). Bypassing the form gains nothing.
- **The registration race is handled** — a concurrent insert that wins between the
  existence check and the create is caught as Prisma `P2002` and returned as the same
  409 (`src/app/api/auth/register/route.ts:60-62`), backed by `email String @unique` in
  the schema (`prisma/schema.prisma:18`).
- **Redirects after sign-in stay on the Auth.js mechanism** — `getRedirectTo`
  (`src/actions/auth.ts:35-38`) passes `callbackUrl` to `signIn({ redirectTo })` rather
  than to a bare `redirect()`, so Auth.js's same-origin restriction applies. The only
  hand-written redirects go to fixed literals (`src/actions/auth.ts:173`, `:181`,
  `src/actions/profile.ts:97`).
- **The verify-email route cannot be turned into an open redirect** — it only ever
  redirects to `SIGN_IN_PATH` with a fixed set of query flags
  (`src/app/api/auth/verify-email/route.ts:6-14`); nothing from the request reaches the
  destination.
- **A JWT for a deleted account does not crash or leak** — the profile page calls
  `notFound()` when the session's user row is gone
  (`src/app/(app)/profile/page.tsx:27-29`).

## Known & Accepted

- **JWT sessions survive a password change or reset** — still open. Invalidating them
  needs a token-version column; the Low finding above proposes narrowing the blast
  radius on the delete path in the meantime, not fixing the gap itself.
- **`REQUIRE_EMAIL_VERIFICATION=false` in local `.env`** — intentional development
  toggle. The flag's parsing was re-checked this run and fails closed as documented
  (`src/lib/feature-flags.ts:6-7`); no issue with the mechanism.
- **GitHub-created users keep their email's original case** — still open. The same
  address in a different case can register a second account, since `emailSchema`
  lowercases only on the paths it guards.
- **The reset page does not lowercase the `email` query param** — still open
  (`src/app/(auth)/reset-password/page.tsx:45` passes `params.email` straight to
  `checkPasswordResetToken`, while `resetPasswordSchema` lowercases). Harmless in
  practice: the emailed link already carries the lowercased address.
- **A send failure still distinguishes a registered email from an unknown one** — still
  open (`src/actions/auth.ts:113-116` returns an error only when a send was attempted).
  The Medium finding above covers the larger register-endpoint oracle separately.
- **Resend delivers only to the account owner until a domain is verified; `APP_URL` is
  unset on Vercel** — still open. Note that `getAppUrl` throws in production when
  `APP_URL` is missing (`src/lib/auth-tokens.ts:28`), so any verification or reset send
  in production will fail until that variable is set.

## Needs Verification

- Does `next-auth@5.0.0-beta.32` preserve the concrete error class when `authorize`
  throws a `CredentialsSignin` subclass, so that `error instanceof EmailNotVerifiedError`
  at `src/actions/auth.ts:56` actually matches — or does it re-wrap into a generic
  `AuthError` whose `type` is `"CredentialsSignin"`, in which case the "verify your
  email" branch never renders and the user sees "Invalid email or password" instead? The
  published guidance consistently shows `error.type` string comparison rather than
  `instanceof` on a subclass, which suggests the wrapping behavior. This is a UX
  correctness question rather than a security one — the failure mode is a less helpful
  message, not a weaker check — and it is currently unreachable with
  `REQUIRE_EMAIL_VERIFICATION=false`. Worth confirming manually with the flag on before
  production.
