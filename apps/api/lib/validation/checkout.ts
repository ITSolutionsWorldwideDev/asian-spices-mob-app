// apps/web/lib/validation/checkout.ts

import { z } from "zod";

export const checkoutSchema = z.object({
  email: z.string().email("Invalid email"),
  phone: z.string().min(10, "Phone must be at least 10 digits"),

  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),

  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  // state: z.string().min(1, "State is required"),
  zip: z.string().min(3, "ZIP is required"),
  country: z
    .string()
    .min(1, "Country is required")
    .refine((val) => val !== "", {
      message: "Please select a country",
    }),
  //   country: z.string().min(1, "Country is required"),
});
