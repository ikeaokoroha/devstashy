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

export async function sendVerificationEmail(to: string, verifyUrl: string) {
  const { error } = await getResend().emails.send({
    from: process.env.EMAIL_FROM ?? DEFAULT_EMAIL_FROM,
    to,
    subject: "Verify your email for Devstashy",
    text: `Confirm your email address to finish setting up your Devstashy account:\n\n${verifyUrl}\n\nThis link expires in 24 hours. If you didn't create an account, you can ignore this email.`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; color: #111827;">
        <h1 style="font-size: 20px;">Verify your email</h1>
        <p>Confirm your email address to finish setting up your Devstashy account.</p>
        <p>
          <a href="${verifyUrl}" style="display: inline-block; padding: 10px 16px; border-radius: 8px; background: #7c3aed; color: #ffffff; text-decoration: none;">
            Verify email
          </a>
        </p>
        <p style="font-size: 13px; color: #6b7280;">
          This link expires in 24 hours. If you didn't create an account, you can ignore this email.
        </p>
      </div>
    `,
  });
  if (error) {
    throw new Error(`Resend failed to send the verification email: ${error.message}`);
  }
}
