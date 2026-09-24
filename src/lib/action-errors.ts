import { z } from "zod";

import type { ActionResult } from "@/types/actions";

// The first message for each invalid field, for the form to show inline.
export function fieldErrorResult<Field extends string>(
  error: z.ZodError<Record<Field, unknown>>
): ActionResult<{ fieldErrors: Partial<Record<Field, string>> }> {
  const { fieldErrors } = z.flattenError(error);
  return {
    success: false,
    error: "Please fix the highlighted fields.",
    data: {
      fieldErrors: Object.fromEntries(
        Object.entries<string[] | undefined>(fieldErrors).map(([field, messages]) => [
          field,
          messages?.[0],
        ])
      ) as Partial<Record<Field, string>>,
    },
  };
}
