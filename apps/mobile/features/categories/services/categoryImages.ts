import type { ImageSource } from "expo-image";

// Old + new category images from assets/images
export const ALL_CATEGORY_IMAGES = [
  require("@/assets/images/images.jpg"),
  require("@/assets/images/images (1).jpg"),
  require("@/assets/images/category-foods-alt.jpg"),
  require("@/assets/images/These-are-the-spices-used-in-Asian-cooking-01-1200x1500.jpg"),
  require("@/assets/images/images (2).jpg"),
  require("@/assets/images/images (3).jpg"),
] as const;

function hashSlug(value: string) {
  return value.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

export function resolveCategoryImage(slugOrId: string, _name: string): ImageSource {
  const index = hashSlug(slugOrId || _name) % ALL_CATEGORY_IMAGES.length;
  return ALL_CATEGORY_IMAGES[index];
}
