// apps/web/lib/zod-errors.ts

import { z } from "zod";

export function zodToFieldErrors(issues: z.ZodIssue[]): Record<string, string> {
  const errors: Record<string, string> = {};

  issues.forEach((err) => {
    const key = err.path[0];

    if (typeof key === "string") {
      errors[key] = err.message;
    }
  });

  return errors;
}
