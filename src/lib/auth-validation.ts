import { z } from "zod";

// bcrypt only uses the first 72 bytes of a password, so longer ones are rejected
// rather than silently truncated.
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 72;

// Emails are stored lowercase so sign-in matches regardless of how they were typed.
const emailSchema = z.string().trim().toLowerCase().pipe(z.email());

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

export const registerSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(100),
    email: emailSchema,
    password: z
      .string()
      .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
      .max(PASSWORD_MAX_LENGTH, `Password must be at most ${PASSWORD_MAX_LENGTH} characters`),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
