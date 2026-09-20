import { Resend } from "resend";

// Without a verified domain, Resend only sends from onboarding@resend.dev, and
// only to the Resend account's own address.
const DEFAULT_EMAIL_FROM = "Devstashy <onboarding@resend.dev>";

let resend: Resend | undefined;

// Created on first send so a missing key fails that send, not the build.
function getResend() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not set");
  }
  resend ??= new Resend(process.env.RESEND_API_KEY);
  return resend;
}

interface ActionEmail {
  to: string;
  subject: string;
  heading: string;
  body: string;
  buttonLabel: string;
  url: string;
  footer: string;
  // Named in the error so a failed send says which email didn't go out.
  kind: string;
}

// Every email we send is the same shape: a line of explanation and a button
// linking back to the app.
async function sendActionEmail({ to, subject, heading, body, buttonLabel, url, footer, kind }: ActionEmail) {
  const { error } = await getResend().emails.send({
    from: process.env.EMAIL_FROM ?? DEFAULT_EMAIL_FROM,
    to,
    subject,
    text: `${body}\n\n${url}\n\n${footer}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; color: #111827;">
        <h1 style="font-size: 20px;">${heading}</h1>
        <p>${body}</p>
        <p>
          <a href="${url}" style="display: inline-block; padding: 10px 16px; border-radius: 8px; background: #7c3aed; color: #ffffff; text-decoration: none;">
            ${buttonLabel}
          </a>
        </p>
        <p style="font-size: 13px; color: #6b7280;">${footer}</p>
      </div>
    `,
  });
  if (error) {
    throw new Error(`Resend failed to send the ${kind} email: ${error.message}`);
  }
}

export function sendVerificationEmail(to: string, verifyUrl: string) {
  return sendActionEmail({
    to,
    kind: "verification",
    subject: "Verify your email for Devstashy",
    heading: "Verify your email",
    body: "Confirm your email address to finish setting up your Devstashy account.",
    buttonLabel: "Verify email",
    url: verifyUrl,
    footer: "This link expires in 24 hours. If you didn't create an account, you can ignore this email.",
  });
}

export function sendPasswordResetEmail(to: string, resetUrl: string) {
  return sendActionEmail({
    to,
    kind: "password reset",
    subject: "Reset your Devstashy password",
    heading: "Reset your password",
    body: "Choose a new password for your Devstashy account.",
    buttonLabel: "Reset password",
    url: resetUrl,
    footer:
      "This link expires in 1 hour and can only be used once. If you didn't ask to reset your password, you can ignore this email — your password won't change.",
  });
}
