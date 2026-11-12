import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE } from "@/shared/services/api/apiBase";

const AUTH_TOKEN_STORAGE_KEY = "@asian_spices_auth_token";

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE,
    credentials: "include", // same as your httpClient / NextAuth cookies
    prepareHeaders: async (headers) => {
      headers.set("Accept", "application/json");
      headers.set("Content-Type", "application/json");

      const token = await AsyncStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      return headers;
    },
  }),
  tagTypes: ["Product", "Order", "Cart", "Wishlist", "Recipe", "Review"],
  endpoints: () => ({}), // endpoints added via injectEndpoints
});