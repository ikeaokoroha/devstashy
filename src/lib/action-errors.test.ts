import { describe, expect, it } from "vitest";
import { z } from "zod";

import { fieldErrorResult } from "@/lib/action-errors";

const schema = z.object({
  title: z.string().min(3, "Too short").regex(/^[a-z]/, "Must start lowercase"),
  url: z.url("Enter a valid URL"),
});

function errorFor(data: unknown) {
  const result = schema.safeParse(data);
  if (result.success) throw new Error("expected the parse to fail");
  return result.error;
}

describe("fieldErrorResult", () => {
  it("reports one message per invalid field", () => {
    const result = fieldErrorResult(errorFor({ title: "ok", url: "nope" }));

    expect(result).toEqual({
      success: false,
      error: "Please fix the highlighted fields.",
      data: { fieldErrors: { title: "Too short", url: "Enter a valid URL" } },
    });
  });

  it("keeps only the first message when a field fails more than one check", () => {
    const { fieldErrors } = fieldErrorResult(errorFor({ title: "A", url: "https://x.dev" })).data!;

    expect(fieldErrors.title).toBe("Too short");
  });

  it("leaves valid fields out entirely", () => {
    const { fieldErrors } = fieldErrorResult(errorFor({ title: "valid", url: "nope" })).data!;

    expect(fieldErrors).toEqual({ url: "Enter a valid URL" });
  });
});
