import { CredentialsSignin } from "next-auth";

// Thrown by authorize only after the password matches, so it doesn't reveal
// whether an unverified email is registered.
export class EmailNotVerifiedError extends CredentialsSignin {
  code = "email_not_verified";
}
