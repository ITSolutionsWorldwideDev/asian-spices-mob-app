// apps/web/lib/validation/account.ts

import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional(),
});

export const addressSchema = z
  .object({
    label: z.string().min(2, "Address label is required"),

    address_line1: z
      .string()
      .min(5, "Address line 1 must be at least 5 characters"),

    address_line2: z.string().optional(),

    city: z.string().min(2, "City name is required"),

    state: z.string().optional(),

    postal_code: z.string().min(3, "Postal code is required"),

    country: z.string().min(2, "Country is required"),

    is_shipping_address: z.boolean().default(true),
    is_billing_address: z.boolean().default(true),
  })
  .refine((data) => data.is_shipping_address || data.is_billing_address, {
    message: "Select at least one address type",
    path: ["is_shipping_address"],
  });

/* import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().min(2, "Name is required"),
});

export const addressSchema = z.object({
  label: z.string().min(1),
  address_line1: z.string().min(5),
  address_line2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().optional(),
  postal_code: z.string().min(3),
  country: z.string().min(2),
}); */

/* export const passwordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6),
  confirmPassword: z.string().min(6),
}); */
export const passwordSchema = z
  .object({
    currentPassword: z
      .string()
      .trim()
      .min(6, "Current password must be at least 6 characters"),

    newPassword: z
      .string()
      .trim()
      .min(6, "New password must be at least 6 characters"),

    confirmPassword: z
      .string()
      .trim()
      .min(6, "Confirm password must be at least 6 characters")
      .optional(),
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "New password must be different from your current password",
    path: ["newPassword"],
  })
  .refine(
    (data) =>
      data.confirmPassword == null || data.newPassword === data.confirmPassword,
    {
      message: "New password and confirm password do not match",
      path: ["confirmPassword"],
    },
  );

export const notificationPreferencesSchema = z.object({
  pushEnabled: z.boolean(),
  orderUpdates: z.boolean(),
  recipeReelUpdates: z.boolean(),
  newProducts: z.boolean(),
  priceDrops: z.boolean(),
  restockAlerts: z.boolean(),
  promotionalEmails: z.boolean(),
});
