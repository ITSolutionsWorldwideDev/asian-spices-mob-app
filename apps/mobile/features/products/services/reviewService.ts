import { apiRequest } from "@/shared/services/api/httpClient";
import type { ProductReview } from "@/features/products/types/product";

export type FooterReviewItem = {
  id: string;
  rating: number;
  comment: string;
  guestName: string;
  status: string;
};

const HOME_REVIEW_LIMIT = 5;

type ApiAllReview = {
  id: string | number;
  rating?: number | string | null;
  comment?: string | null;
  guest_name?: string | null;
  name?: string | null;
  status?: string | null;
};

function toNumber(value: string | number | null | undefined) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeReviewPayload(payload: unknown): ApiAllReview[] {
  if (Array.isArray(payload)) {
    return payload as ApiAllReview[];
  }

  if (payload && typeof payload === "object") {
    const record = payload as {
      reviews?: unknown;
      data?: unknown;
      items?: unknown;
    };
    if (Array.isArray(record.reviews)) return record.reviews as ApiAllReview[];
    if (Array.isArray(record.data)) return record.data as ApiAllReview[];
    if (Array.isArray(record.items)) return record.items as ApiAllReview[];
  }

  return [];
}

function mapReview(item: ApiAllReview, index: number): FooterReviewItem | null {
  const comment = item.comment?.trim();
  if (!comment) return null;

  const guestName =
    item.guest_name?.trim() || item.name?.trim() || "Anonymous";

  return {
    id: String(item.id ?? `review-${index}`),
    rating: Math.max(1, Math.min(5, Math.round(toNumber(item.rating) || 0) || 5)),
    comment,
    guestName,
    status: item.status?.trim() || "approved",
  };
}

async function fetchReviewsPage(page: number, limit: number): Promise<FooterReviewItem[]> {
  const response = await apiRequest<unknown>(
    `/api/products/reviews?productId=all&page=${page}&limit=${limit}`,
  );
  const rows = normalizeReviewPayload(response);

  return rows
    .map(mapReview)
    .filter((review): review is FooterReviewItem => review !== null);
}

async function fetchAllReviewPages(): Promise<FooterReviewItem[]> {
  const merged: FooterReviewItem[] = [];

  for (let page = 1; page <= 20; page += 1) {
    const rows = await fetchReviewsPage(page, 10);
    merged.push(...rows);
    if (rows.length < 10) break;
  }

  return merged;
}

/** Home preview — latest 5 reviews only. */
export async function getFooterReviews(): Promise<FooterReviewItem[]> {
  try {
    const reviews = await fetchReviewsPage(1, HOME_REVIEW_LIMIT);
    return reviews.slice(0, HOME_REVIEW_LIMIT);
  } catch {
    return [];
  }
}

/** Full customer reviews list for the See All page. */
export async function getAllCustomerReviews(): Promise<FooterReviewItem[]> {
  try {
    return await fetchAllReviewPages();
  } catch {
    return [];
  }
}

/** Reviews for one product (product detail page). */
export async function fetchProductReviewList(productId: string): Promise<ProductReview[]> {
  try {
    const response = await apiRequest<{
      reviews?: ApiAllReview[];
    }>(`/api/products/reviews?productId=${encodeURIComponent(productId)}&page=1&limit=20`);

    return (response.reviews ?? [])
      .map((item, index) => {
        const text = item.comment?.trim();
        if (!text) return null;

        return {
          id: String(item.id ?? `review-${index}`),
          author: item.name?.trim() || item.guest_name?.trim() || "Anonymous",
          rating: Math.max(0, Math.min(5, toNumber(item.rating))),
          text,
        };
      })
      .filter((review): review is ProductReview => review !== null);
  } catch {
    return [];
  }
}

/** Submit a product review (saved via existing testimonials API). */
export async function submitProductReview(input: {
  productId: string;
  name: string;
  email: string;
  rating: number;
  comment: string;
}) {
  const response = await apiRequest<{ success?: boolean; message?: string }>(
    "/api/tetimonials",
    {
      method: "POST",
      body: {
        name: input.name.trim(),
        email: input.email.trim(),
        comment: input.comment.trim(),
        rating: input.rating,
        product_id: input.productId,
      },
    },
  );

  if (response.success === false) {
    throw new Error(response.message || "Failed to submit review");
  }

  return response;
}

/** Submit a recipe review. */
export async function submitRecipeReview(input: {
  recipeId: string;
  name: string;
  email: string;
  rating: number;
  comment: string;
}) {
  const response = await apiRequest<{ success?: boolean; message?: string }>(
    "/api/recipes/reviews",
    {
      method: "POST",
      body: {
        recipe_id: input.recipeId,
        name: input.name.trim(),
        email: input.email.trim(),
        comment: input.comment.trim(),
        rating: input.rating,
      },
    },
  );

  if (response.success === false) {
    throw new Error(response.message || "Failed to submit review");
  }

  return response;
}
