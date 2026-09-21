import { CredentialsSignin } from "next-auth";

// Thrown by authorize only after the password matches, so it doesn't reveal
// whether an unverified email is registered.
export class EmailNotVerifiedError extends CredentialsSignin {
  code = "email_not_verified";
}

// Thrown by authorize before the password is checked, once too many attempts
// have been made for this IP and email. Carries the window's reset timestamp so
// the sign-in action can say how long the wait is.
export class TooManyAttemptsError extends CredentialsSignin {
  code = "too_many_attempts";

  constructor(readonly reset: number) {
    super();
  }
}
