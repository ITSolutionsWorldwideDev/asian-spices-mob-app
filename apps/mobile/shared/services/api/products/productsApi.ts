import { apiSlice } from "@/shared/services/api/apiSlice";

// export type Product={
//   id: string;
//   name: string;

// }
/** API returns `{ data: Product[], total }`, not a bare array. */
function unwrapProductsResponse(response: any) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  return [];
}

export const productsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query<any[], void>({
      query: () => "/api/products?category=all",
      transformResponse: unwrapProductsResponse,
      providesTags: ["Product"],
    }),
    getNewArrivals: builder.query<any[], void>({
      query: () => "/api/products?category=all&sort=newest&limit=6",
      transformResponse: unwrapProductsResponse,
      providesTags: ["Product"],
    }),
    getPopularProducts: builder.query<any[], void>({
      query: () => "/api/products?category=all&sort=popular&limit=6",
      transformResponse: unwrapProductsResponse,
      providesTags: ["Product"],
    }),
    getTopRatedProducts: builder.query<any[], void>({
      query: () => "/api/products/top-rated",
      transformResponse: unwrapProductsResponse,
      providesTags: ["Product"],
    }),
    getProductById: builder.query<any, string>({
      query: (id) => `/api/products/${id}`,
      transformResponse: (response: any) => {
        if (Array.isArray(response?.data)) return response.data[0] ?? null;
        if (Array.isArray(response)) return response[0] ?? null;
        return response ?? null;
      },
      providesTags: (_result, _error, id) => [{ type: "Product", id }],
    }),
  }),
  overrideExisting: true,
});

export const { useGetProductsQuery, useGetProductByIdQuery, useGetNewArrivalsQuery, useGetPopularProductsQuery, useGetTopRatedProductsQuery } = productsApi;