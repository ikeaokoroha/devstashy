import { describe, expect, it } from "vitest";

import { registerSchema, signInSchema } from "@/lib/auth-validation";

const validRegistration = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  password: "correct-horse",
  confirmPassword: "correct-horse",
};

describe("registerSchema", () => {
  it("accepts a valid registration", () => {
    expect(registerSchema.safeParse(validRegistration).success).toBe(true);
  });

  it("trims and lowercases the email", () => {
    const parsed = registerSchema.parse({ ...validRegistration, email: "  Ada@Example.COM " });
    expect(parsed.email).toBe("ada@example.com");
  });

  it("reports mismatched passwords on confirmPassword", () => {
    const result = registerSchema.safeParse({ ...validRegistration, confirmPassword: "different" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["confirmPassword"]);
  });

  it("rejects passwords outside 8–72 characters", () => {
    for (const password of ["short", "a".repeat(73)]) {
      const result = registerSchema.safeParse({
        ...validRegistration,
        password,
        confirmPassword: password,
      });
      expect(result.success).toBe(false);
    }
  });
});

describe("signInSchema", () => {
  it("rejects an invalid email", () => {
    expect(signInSchema.safeParse({ email: "not-an-email", password: "x" }).success).toBe(false);
  });
});
