import type { ImageSource } from "expo-image";

export const CATEGORY_IMAGE_ASSETS = {
  spices: require("@/assets/images/category-spices.jpg"),
  spicesAlt: require("@/assets/images/category-spices-alt.jpg"),
  spicesWide: require("@/assets/images/These-are-the-spices-used-in-Asian-cooking-01-1200x1500.jpg"),
  foods: require("@/assets/images/category-foods.jpg"),
  foodsAlt: require("@/assets/images/category-foods-alt.jpg"),
  kitchen: require("@/assets/images/category-kitchen.jpg"),
  kitchenAlt: require("@/assets/images/category-kitchen-alt.jpg"),
  supplements: require("@/assets/images/herbal-food-supplements-menu.jpg"),
  hair: require("@/assets/images/herbal-hair-products-menu.jpg"),
  skin: require("@/assets/images/herbal-skin-products-menu.jpg"),
  health: require("@/assets/images/health-benefits-menu.jpg"),
} as const;

export const ALL_CATEGORY_IMAGES = [
  CATEGORY_IMAGE_ASSETS.spices,
  CATEGORY_IMAGE_ASSETS.foods,
  CATEGORY_IMAGE_ASSETS.kitchen,
  CATEGORY_IMAGE_ASSETS.supplements,
  CATEGORY_IMAGE_ASSETS.hair,
  CATEGORY_IMAGE_ASSETS.skin,
  CATEGORY_IMAGE_ASSETS.health,
  CATEGORY_IMAGE_ASSETS.spicesAlt,
  CATEGORY_IMAGE_ASSETS.foodsAlt,
  CATEGORY_IMAGE_ASSETS.kitchenAlt,
  CATEGORY_IMAGE_ASSETS.spicesWide,
] as const;

// Fallback duplicate Unsplash image that was previously copy-pasted across multiple categories
const DUPLICATE_SPICE_UNSPLASH_ID = "photo-1596040033229-a9821ebd058d";

export function resolveCategoryImage(
  slugOrId?: string | null,
  name?: string | null,
  imageUrl?: string | null,
): ImageSource {
  const normalizedSlug = (slugOrId ?? "").toLowerCase().trim();
  const normalizedName = (name ?? "").toLowerCase().trim();
  const combined = `${normalizedSlug} ${normalizedName}`;

  // 1. Spices & Seasoning
  const isSpices =
    normalizedSlug === "1" ||
    normalizedSlug.startsWith("1-") ||
    combined.includes("spice") ||
    combined.includes("season") ||
    combined.includes("masala") ||
    combined.includes("clove") ||
    combined.includes("curry") ||
    combined.includes("tandoori") ||
    combined.includes("biryani") ||
    combined.includes("saffron") ||
    combined.includes("cardamom") ||
    combined.includes("cinnamon") ||
    combined.includes("turmeric");

  // 2. Kitchen Appliances & Cooking Tools
  const isKitchen =
    normalizedSlug === "3" ||
    normalizedSlug.startsWith("8-") ||
    combined.includes("kitchen") ||
    combined.includes("appliance") ||
    combined.includes("cook") ||
    combined.includes("grinder") ||
    combined.includes("mortar") ||
    combined.includes("pestle") ||
    combined.includes("tool") ||
    combined.includes("knife") ||
    combined.includes("utensil") ||
    combined.includes("measuring");

  // 3. Foods & Beverages
  const isFoods =
    normalizedSlug === "2" ||
    normalizedSlug.startsWith("2-") ||
    normalizedSlug.startsWith("7-") ||
    combined.includes("food") ||
    combined.includes("beverage") ||
    combined.includes("snack") ||
    combined.includes("sauce") ||
    combined.includes("chutney") ||
    combined.includes("pickle") ||
    combined.includes("drink") ||
    combined.includes("tea") ||
    combined.includes("noodle") ||
    combined.includes("rice") ||
    combined.includes("pantry") ||
    combined.includes("herb");

  // 4. Healthy Living / Herbal categories
  const isSupplement = combined.includes("supplement");
  const isHair = combined.includes("hair");
  const isSkin = combined.includes("skin");
  const isHealth = combined.includes("health") || combined.includes("benefit");

  // Determine dedicated local asset
  let matchedAsset: ImageSource | null = null;
  if (isSupplement) {
    matchedAsset = CATEGORY_IMAGE_ASSETS.supplements;
  } else if (isHair) {
    matchedAsset = CATEGORY_IMAGE_ASSETS.hair;
  } else if (isSkin) {
    matchedAsset = CATEGORY_IMAGE_ASSETS.skin;
  } else if (isHealth) {
    matchedAsset = CATEGORY_IMAGE_ASSETS.health;
  } else if (isKitchen) {
    if (combined.includes("mortar") || combined.includes("pestle") || combined.includes("tool")) {
      matchedAsset = CATEGORY_IMAGE_ASSETS.kitchenAlt;
    } else {
      matchedAsset = CATEGORY_IMAGE_ASSETS.kitchen;
    }
  } else if (isFoods) {
    if (
      combined.includes("sauce") ||
      combined.includes("pickle") ||
      combined.includes("dried") ||
      combined.includes("preserve")
    ) {
      matchedAsset = CATEGORY_IMAGE_ASSETS.foodsAlt;
    } else {
      matchedAsset = CATEGORY_IMAGE_ASSETS.foods;
    }
  } else if (isSpices) {
    if (combined.includes("ground") || combined.includes("hot") || combined.includes("chili")) {
      matchedAsset = CATEGORY_IMAGE_ASSETS.spicesAlt;
    } else if (combined.includes("blend") || combined.includes("mix") || combined.includes("rare")) {
      matchedAsset = CATEGORY_IMAGE_ASSETS.spicesWide;
    } else {
      matchedAsset = CATEGORY_IMAGE_ASSETS.spices;
    }
  }

  // Check remote imageUrl
  const cleanUrl = (imageUrl ?? "").trim();
  if (cleanUrl.startsWith("http://") || cleanUrl.startsWith("https://")) {
    const isDuplicateSpiceUrl = cleanUrl.includes(DUPLICATE_SPICE_UNSPLASH_ID);
    // If the image is the duplicate spice photo but the category is NOT spices (e.g. food or kitchen),
    // discard the duplicate remote photo and return the correct matched asset
    if (isDuplicateSpiceUrl && !isSpices && matchedAsset) {
      return matchedAsset;
    }
    if (!isDuplicateSpiceUrl) {
      return { uri: cleanUrl };
    }
  }

  if (matchedAsset) {
    return matchedAsset;
  }

  // Fallback hash resolution across unique images
  const hash = (slugOrId || name || "category")
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return ALL_CATEGORY_IMAGES[hash % ALL_CATEGORY_IMAGES.length];
}
