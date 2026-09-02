import { apiRequest } from "@/services/api/httpClient";
import type { ProductSeller } from "@/types/seller";

type BackendSeller = {
  id: string;
  name: string;
};

type SellerResponse = {
  seller?: BackendSeller;
  error?: string;
};

export async function fetchProductSeller(productId: string): Promise<ProductSeller | null> {
  try {
    const response = await apiRequest<SellerResponse>(
      `/api/products/seller?productId=${encodeURIComponent(productId)}`,
    );
    return response.seller ?? null;
  } catch {
    return null;
  }
}
