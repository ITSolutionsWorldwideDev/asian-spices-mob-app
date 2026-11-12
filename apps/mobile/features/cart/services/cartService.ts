import { getProductMeta, setProductMetaFromApiRow } from "@/shared/services/api/productMetaCache";
import { apiRequest } from "@/shared/services/api/httpClient";
import { resolveProductPricing } from "@/features/products/services/productPricing";
import type { CartItem } from "@/features/cart/types/cart";

type ApiCartItemRow = {
  product_id?: string;
  quantity?: number | string | null;
  unit_price?: number | string | null;
  title?: string | null;
  base_price?: number | string | null;
  discount_type?: string | null;
  discount_value?: number | string | null;
  sale_price?: number | string | null;
  min_offered_price?: number | string | null;
  category_id?: string | number | null;
  image?: string | null;
};

const IMAGE_FALLBACK =
  "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80";

function toNumber(value: string | number | null | undefined) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Fallback when no stored product-page price exists (e.g. server-only cart item). */
function resolveFallbackUnitPrice(row: ApiCartItemRow, productId: string) {
  const meta = getProductMeta(productId);
  const categoryId =
    row.category_id != null
      ? String(row.category_id)
      : (meta?.categoryId ?? null);

  return resolveProductPricing({
    base_price: row.base_price,
    sale_price: row.sale_price,
    min_offered_price: row.min_offered_price,
    discount_type: row.discount_type,
    discount_value: row.discount_value,
    category_id: categoryId,
  }).price;
}

function mapApiRowToCartItem(
  row: ApiCartItemRow,
  storedItem?: CartItem,
): CartItem | null {
  const productId = row.product_id;
  if (!productId) return null;

  const id = String(productId);
  const basePrice = toNumber(row.base_price);
  const unitPrice = toNumber(row.unit_price);
  const categoryId = row.category_id ?? getProductMeta(id)?.categoryId ?? null;

  if (categoryId != null || basePrice > 0) {
    setProductMetaFromApiRow(id, {
      category_id: categoryId,
      base_price: basePrice > 0 ? basePrice : null,
    });
  }

  // Prefer live catalog pricing (VAT → discount) so cart matches product cards / web
  const resolvedPrice =
    basePrice > 0 || row.discount_value != null || row.sale_price != null
      ? resolveFallbackUnitPrice(row, id)
      : 0;

  return {
    id,
    name: row.title?.trim() || storedItem?.name || "Product",
    image: row.image || storedItem?.image || IMAGE_FALLBACK,
    weight: storedItem?.weight ?? "",
    basePrice: storedItem?.basePrice ?? (basePrice > 0 ? basePrice : undefined),
    price:
      resolvedPrice > 0
        ? resolvedPrice
        : storedItem?.price ?? (unitPrice > 0 ? unitPrice : 0),
    quantity: Math.max(1, Math.round(toNumber(row.quantity) || 1)),
  };
}

export async function fetchCartItemsFromApi(
  localItems: CartItem[] = [],
): Promise<CartItem[]> {
  const localById = new Map(localItems.map((item) => [item.id, item]));
  const payload = await apiRequest<ApiCartItemRow[]>("/api/cart");

  return (Array.isArray(payload) ? payload : [])
    .map((row) => mapApiRowToCartItem(row, localById.get(String(row.product_id ?? ""))))
    .filter((item): item is CartItem => Boolean(item));
}

export async function addCartItemToApi(
  productId: string,
  quantity: number,
  unitPrice: number,
): Promise<void> {
  await apiRequest<{ success?: boolean }>("/api/cart", {
    method: "POST",
    body: { product_id: productId, quantity, price: unitPrice },
  });
}

export async function updateCartItemDeltaInApi(productId: string, delta: number): Promise<void> {
  await apiRequest<{ success?: boolean }>("/api/cart/update", {
    method: "PATCH",
    body: { product_id: productId, delta },
  });
}

export async function removeCartItemFromApi(productId: string): Promise<void> {
  await apiRequest<{ success?: boolean }>("/api/cart", {
    method: "DELETE",
    body: { product_id: productId },
  });
}

export async function clearCartInApi(): Promise<void> {
  await apiRequest<{ success?: boolean }>("/api/cart", {
    method: "DELETE",
    body: {},
  });
}

export async function mergeLocalCartToApi(items: CartItem[]): Promise<void> {
  if (items.length === 0) return;
  await apiRequest<{ success?: boolean }>("/api/cart/merge", {
    method: "POST",
    body: { items: items.map((item) => ({ id: item.id, quantity: item.quantity, price: item.price })) },
  });
}
