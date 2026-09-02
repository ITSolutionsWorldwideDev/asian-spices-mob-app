type ProductMeta = {
  categoryId?: string | null;
  basePrice?: number | null;
};

const productMetaCache = new Map<string, ProductMeta>();

function parseBasePrice(value?: string | number | null) {
  const numeric =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : null;
  return Number.isFinite(numeric) && numeric != null && numeric > 0 ? numeric : null;
}

export function setProductMeta(productId: string, meta: ProductMeta) {
  const existing = productMetaCache.get(productId) ?? {};
  productMetaCache.set(productId, {
    ...existing,
    ...meta,
  });
}

export function setProductMetaFromApiRow(
  productId: string,
  row: { category_id?: string | number | null; base_price?: string | number | null },
) {
  setProductMeta(productId, {
    categoryId:
      row.category_id != null ? String(row.category_id) : null,
    basePrice: parseBasePrice(row.base_price),
  });
}

export function getProductMeta(productId: string): ProductMeta | null {
  return productMetaCache.get(productId) ?? null;
}
