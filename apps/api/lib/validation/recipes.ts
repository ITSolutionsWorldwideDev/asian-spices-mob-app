// lib/validation/recipes.ts

import { z } from "zod";

export const recipeSchema = z.object({
  title: z.string().min(3, "Title is required"),

  slug: z.string().min(3, "Slug is required"),

  short_description: z.string().optional(),

  thumbnail_url: z.union([
    z.string().url("Invalid thumbnail URL"),
    z.literal(""),
  ]),

  youtube_url: z.union([
    z.string().url("Invalid YouTube URL"),
    z.literal(""),
  ]),

  content: z.string().min(20, "Content is too short"),
});