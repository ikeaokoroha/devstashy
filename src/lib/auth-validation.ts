import { z } from "zod";

// bcrypt only uses the first 72 bytes of a password, so longer ones are rejected
// rather than silently truncated.
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 72;

// Emails are stored lowercase so sign-in matches regardless of how they were typed.
const emailSchema = z.string().trim().toLowerCase().pipe(z.email());

const newPasswordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
  .max(PASSWORD_MAX_LENGTH, `Password must be at most ${PASSWORD_MAX_LENGTH} characters`);

const passwordsMatch = {
  message: "Passwords do not match",
  path: ["confirmPassword"],
};

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

export const resendVerificationSchema = z.object({ email: emailSchema });

export const forgotPasswordSchema = z.object({ email: emailSchema });

// The email and token ride along in hidden fields, straight from the reset link.
export const resetPasswordSchema = z
  .object({
    email: emailSchema,
    token: z.string().min(1),
    password: newPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, passwordsMatch);

export const registerSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(100),
    email: emailSchema,
    password: newPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, passwordsMatch);
