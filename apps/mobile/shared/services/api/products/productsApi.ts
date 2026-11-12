import { apiSlice } from "@/shared/services/api/apiSlice";

// export type Product={
//   id: string;
//   name: string;

// }
export const productsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query<any, void>({
      query: () => "/api/products/",
      providesTags: ["Product"],
    }),
    getNewArrivals: builder.query<any, void>({
      query: () => "/api/products?sort=newest&limit=6",
      providesTags: ["Product"],
    }),
    getPopularProducts: builder.query<any, void>({
      query: () => "/api/products?sort=popular&limit=6",
      providesTags: ["Product"],
    }),
    getTopRatedProducts: builder.query<any, void>({
      query: () => "/api/products/top-rated",
      providesTags: ["Product"],
    }),
    getProductById: builder.query<any, string>({
      query: (id) => `/api/products/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Product", id }],
    }),
  }),
  overrideExisting: true,
});

export const { useGetProductsQuery, useGetProductByIdQuery, useGetNewArrivalsQuery, useGetPopularProductsQuery, useGetTopRatedProductsQuery } = productsApi;