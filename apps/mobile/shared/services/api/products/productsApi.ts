import { apiSlice } from "@/shared/services/api/apiSlice";

export type Product={
  id: string;
  name: string;
}
export const productsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query<Product[],void>({
      query: () => "/api/products",
      providesTags: ["Product"],
    }),
    getProductById: builder.query<Product,string>({
      query: (id) => `/api/products/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Product", id }],
    }),
  }),
  overrideExisting: true,
});

export const { useGetProductsQuery, useGetProductByIdQuery } = productsApi;