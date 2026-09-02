// 📁 lib/form/getErrorMessage.ts

import { FieldError, Merge, FieldErrorsImpl } from "react-hook-form";

export function getErrorMessage(
  error:
    | string
    | FieldError
    | Merge<FieldError, FieldErrorsImpl<any>>
    | undefined,
): string | undefined {
  if (!error) return undefined;

  if (typeof error === "string") return error;

  if ("message" in error && typeof error.message === "string") {
    return error.message;
  }

  return undefined;
}