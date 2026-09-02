// core/utils/useZodForm.ts

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

export function useZodForm(schema: any, defaultValues = {}) {
  return useForm({
    resolver: zodResolver(schema),
    defaultValues,
  });
}