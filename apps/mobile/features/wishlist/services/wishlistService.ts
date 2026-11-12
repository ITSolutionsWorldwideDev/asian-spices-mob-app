import { refreshNextAuthSession } from "@/features/auth/services/authService";
import { ApiRequestError, apiRequest } from "@/shared/services/api/httpClient";
import { getProductMeta } from "@/shared/services/api/productMetaCache";
import { resolveProductPricing } from "@/features/products/services/productPricing";
import { ensureTaxRulesLoaded } from "@/shared/services/tax/taxService";
import type { WishlistItem } from "@/features/wishlist/types/wishlist";

type WishlistApiRow = {
  id: string;
  name?: string | null;
  base_price?: string | number | null;
  image?: string | null;
};

const IMAGE_FALLBACK =
  "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80";

async function apiRequestWithSessionRetry<T>(
  path: string,
  options?: Omit<RequestInit, "body"> & { body?: unknown },
): Promise<T> {
  try {
    return await apiRequest<T>(path, options);
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 401) {
      const refreshed = await refreshNextAuthSession();
      if (refreshed) {
        return apiRequest<T>(path, options);
      }
    }
    throw error;
  }
}

function toWishlistItem(row: WishlistApiRow): WishlistItem {
  const meta = getProductMeta(String(row.id));
  const pricing = resolveProductPricing({
    base_price: row.base_price,
    category_id: meta?.categoryId ?? null,
  });
  return {
    id: String(row.id),
    name: row.name?.trim() || "Product",
    image: row.image || IMAGE_FALLBACK,
    price: pricing.price,
    originalPrice: pricing.originalPrice,
  };
}

function assertWriteSucceeded(payload: unknown) {
  // Backend returns [] with 200 when session is missing.
  if (Array.isArray(payload)) {
    throw new ApiRequestError("Please login to manage wishlist", 401);
  }
  if (!payload || typeof payload !== "object" || !(payload as { success?: boolean }).success) {
    throw new ApiRequestError("Wishlist update failed");
  }
}

export async function fetchWishlistItemsFromApi(): Promise<WishlistItem[]> {
  await ensureTaxRulesLoaded();
  const payload = await apiRequestWithSessionRetry<WishlistApiRow[] | { error?: string }>(
    "/api/wishlist",
  );

  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .filter((row) => Boolean(row?.id))
    .map(toWishlistItem);
}

export async function addWishlistItemToApi(productId: string): Promise<void> {
  const payload = await apiRequestWithSessionRetry<unknown>("/api/wishlist", {
    method: "POST",
    body: { product_id: productId },
  });
  assertWriteSucceeded(payload);
}

export async function removeWishlistItemFromApi(productId: string): Promise<void> {
  const payload = await apiRequestWithSessionRetry<unknown>("/api/wishlist", {
    method: "DELETE",
    body: { product_id: productId },
  });
  assertWriteSucceeded(payload);
}

export async function syncLocalWishlistToApi(items: WishlistItem[]): Promise<void> {
  for (const item of items) {
    try {
      await addWishlistItemToApi(item.id);
    } catch {
      // Continue remaining items; caller will refetch.
    }
  }
}
