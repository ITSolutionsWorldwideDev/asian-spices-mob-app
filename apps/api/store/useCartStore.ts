// apps/web/store/useCartStore.ts

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string;
  title: string;
  base_price: number;
  oldPrice?: number;
  quantity: number;
  image: string;

  slug?: string;
  category_id?: string;
  category_slug?: string;

  discount_type?: string;
  discount_value?: number;
  promo_code?: string;
}

interface CartState {
  cart: CartItem[];

  addToCart: (item: Omit<CartItem, "quantity">, isLoggedIn: boolean) => void;
  removeFromCart: (id: string, isLoggedIn: boolean) => void;

  increaseQty: (id: string, isLoggedIn: boolean) => void;
  decreaseQty: (id: string, isLoggedIn: boolean) => void;
  setQty: (id: string, quantity: number, isLoggedIn: boolean) => void;

  setCart: (items: CartItem[]) => void;
  clearCart: (isLoggedIn?: boolean) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: [],

      addToCart: async (item, isLoggedIn) => {

        const normalizeId = (id: string | number) =>
          id.toString().toLowerCase().trim();

        const targetId = normalizeId(item.id);
        const existing = get().cart.find((i) => normalizeId(i.id) === targetId);

        let updatedCart;

        if (existing) {
          updatedCart = get().cart.map((i) =>
            normalizeId(i.id) === targetId
              ? { ...i, quantity: i.quantity + 1 }
              : i,
          );
        } else {
          updatedCart = [...get().cart, { ...item, id: targetId, quantity: 1 }];
        }

        set({ cart: updatedCart });
        
        if (!isLoggedIn) return;

        try {
          await fetch("/api/cart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              product_id: item.id,
              // base_price: item.base_price,
              quantity: 1,
            }),
          });
        } catch (err) {
          console.error("Cart sync failed", err);
        }
      },

      /* ---------------- REMOVE ---------------- */

      removeFromCart: async (id, isLoggedIn) => {
        const targetId = id.toString();

        set({
          cart: get().cart.filter((i) => i.id.toString() !== targetId),
        });

        if (!isLoggedIn) return;

        try {
          const res = await fetch("/api/cart", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ product_id: id }),
          });

          if (!res.ok) {
            throw new Error("Delete failed");
          }
        } catch (err) {
          console.error("Remove failed, reverting", err);

          const res = await fetch("/api/cart");
          const dbCart = await res.json();

          set({
            cart: dbCart.map((item: any) => ({
              id: item.product_id,
              title: item.title || "Product",
              base_price: Number(item.base_price),
              quantity: item.quantity,
              image: item.image || "",
              category_id: item.category_id || "",
              category_slug: item.category_slug || "",
            })),
          });
        }
      },

      /* ---------------- INCREASE ---------------- */
      increaseQty: async (id, isLoggedIn) => {

        const targetId = id.toString();
        set({
          cart: get().cart.map((i) =>
            i.id.toString() === targetId
              ? { ...i, quantity: i.quantity + 1 }
              : i,
          ),
        });

        if (!isLoggedIn) return;

        try {
          await fetch("/api/cart/update", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              product_id: id,
              delta: 1,
            }),
          });
        } catch (err) {
          console.error("Increase failed", err);
        }
      },

      /* ---------------- DECREASE ---------------- */
      decreaseQty: async (id, isLoggedIn) => {

        const targetId = id.toString();
        const item = get().cart.find((i) => i.id.toString() === targetId);

        if (!item) return;

        if (item.quantity === 1) {
          return get().removeFromCart(id, isLoggedIn);
        }

        set({
          cart: get().cart.map((i) =>
            i.id.toString() === targetId
              ? { ...i, quantity: i.quantity - 1 }
              : i,
          ),
        });

        if (!isLoggedIn) return;

        try {
          await fetch("/api/cart/update", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              product_id: id,
              delta: -1,
            }),
          });
        } catch (err) {
          console.error("Decrease failed", err);
        }
      },

      setQty: async (id, quantity, isLoggedIn) => {
        const qty = Math.max(1, quantity);

        const targetId = id.toString();

        set({
          cart: get().cart.map((i) =>
            i.id.toString() === targetId ? { ...i, quantity: qty } : i,
          ),
        });

        if (!isLoggedIn) return;

        try {
          await fetch("/api/cart/set-qty", {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              product_id: id,
              quantity: qty,
            }),
          });
        } catch (err) {
          console.error("Set qty failed", err);
        }
      },

      setCart: (items) => set({ cart: items }),

      clearCart: async (isLoggedIn = false) => {

        set({ cart: [] });

        if (typeof window !== "undefined") {
          localStorage.removeItem("cart-storage");
        }

        if (!isLoggedIn) return;

        try {
          await fetch("/api/cart", {
            method: "DELETE",
          });
        } catch (err) {
          console.error("Failed to clear DB cart:", err);
        }
      },
    }),
    {
      name: "cart-storage",
      version: 1,
      migrate: (state: any): CartState => {
        return {
          cart: (state?.cart || []).map((i: any) => ({
            ...i,
            id: i.id?.toString(),
          })),
          addToCart: () => {},
          removeFromCart: () => {},
          increaseQty: () => {},
          decreaseQty: () => {},
          setQty: () => {},
          setCart: () => {},
          clearCart: () => {},
        };
      },
    },
  ),
);
