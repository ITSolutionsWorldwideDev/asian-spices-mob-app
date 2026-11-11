import {
  addCartItemToApi,
  clearCartInApi,
  fetchCartItemsFromApi,
  mergeLocalCartToApi,
  removeCartItemFromApi,
  updateCartItemDeltaInApi,
} from "@/services/cartService";
import { getStoredAuthUser } from "@/services/api/authService";
import { getProductMeta } from "@/services/api/productMetaCache";
import {
  getCartItemTax,
  getCartItemVatPercent,
  getCartTaxTotal,
  ensureTaxRulesLoaded,
  setCachedTaxRules,
  type TaxRule,
} from "@/services/taxService";
import type { CartItem } from "@/types/cart";
import type { ProductDetail } from "@/types/product";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const CART_STORAGE_KEY = "@asian_spices_cart";
export const SHIPPING_FEE = 4.99;
export const FREE_SHIPPING_THRESHOLD = 50;
export const MIN_ORDER_AMOUNT_EUR = 10;

export function consolidateCartItems(items: CartItem[]): CartItem[] {
  const map = new Map<string, CartItem>();

  for (const item of items) {
    const rawId = item.id != null ? String(item.id).trim() : "";
    const key = rawId.toLowerCase();
    if (!key) continue;

    const qty = Math.max(1, Math.round(Number(item.quantity) || 1));
    const existing = map.get(key);

    if (existing) {
      existing.quantity += qty;
      if (item.price > 0) existing.price = item.price;
      if (item.image) existing.image = item.image;
      if (item.name && item.name !== "Product") existing.name = item.name;
      if (item.weight) existing.weight = item.weight;
      if (item.basePrice != null) existing.basePrice = item.basePrice;
    } else {
      map.set(key, {
        ...item,
        id: rawId,
        quantity: qty,
      });
    }
  }

  return Array.from(map.values());
}

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  taxTotal: number;
  getItemTax: (item: CartItem) => number;
  getItemVatPercent: (item: CartItem) => number | null;
  isHydrated: boolean;
  addItem: (product: ProductDetail, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  resetLocalCart: () => void;
  replaceCartItems: (nextItems: CartItem[]) => Promise<void>;
  refreshCart: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [taxRules, setTaxRules] = useState<TaxRule[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  const refreshCart = useCallback(async () => {
    const stored = await AsyncStorage.getItem(CART_STORAGE_KEY);
    const localItems: CartItem[] = stored
      ? consolidateCartItems(JSON.parse(stored) as CartItem[])
      : [];
    const authUser = await getStoredAuthUser();

    if (!authUser) {
      setItems(localItems);
      return;
    }

    try {
      const rawApiItems = await fetchCartItemsFromApi(localItems);
      const apiItems = consolidateCartItems(rawApiItems);
      const apiIds = new Set(apiItems.map((item) => String(item.id).trim().toLowerCase()));
      const localOnly = localItems.filter(
        (item) => !apiIds.has(String(item.id).trim().toLowerCase())
      );

      if (localOnly.length > 0) {
        await mergeLocalCartToApi(localOnly);
        const mergedRaw = await fetchCartItemsFromApi(localItems);
        const mergedItems = consolidateCartItems(mergedRaw);
        setItems(mergedItems);
        return;
      }

      setItems(apiItems);
    } catch {
      setItems(consolidateCartItems(localItems.length > 0 ? localItems : []));
    }
  }, []);

  useEffect(() => {
    refreshCart()
      .catch(console.error)
      .finally(() => setIsHydrated(true));
  }, [refreshCart]);

  useEffect(() => {
    ensureTaxRulesLoaded()
      .then((rules) => {
        setCachedTaxRules(rules);
        setTaxRules(rules);
      })
      .catch(() => setTaxRules([]));
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(consolidateCartItems(items))).catch(console.error);
  }, [items, isHydrated]);

  const addItem = useCallback((product: ProductDetail, quantity = 1) => {
    const meta = getProductMeta(product.id);
    const basePrice = meta?.basePrice ?? undefined;
    const targetId = String(product.id ?? "").trim();
    const targetKey = targetId.toLowerCase();
    const addQty = Math.max(1, Math.round(Number(quantity) || 1));

    setItems((current) => {
      const existingIndex = current.findIndex(
        (item) => String(item.id ?? "").trim().toLowerCase() === targetKey
      );
      if (existingIndex >= 0) {
        return current.map((item, index) =>
          index === existingIndex
            ? { ...item, quantity: item.quantity + addQty, price: product.price || item.price }
            : item
        );
      }
      return [
        ...current,
        {
          id: targetId,
          name: product.name,
          image: product.image,
          weight: product.weight,
          basePrice,
          price: product.price,
          quantity: addQty,
        },
      ];
    });
    void addCartItemToApi(targetId, addQty, product.price).catch(() => {
      // Keep local fallback if API/session is unavailable.
    });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity < 1) return;
    const targetKey = String(productId ?? "").trim().toLowerCase();
    const currentItem = items.find(
      (item) => String(item.id ?? "").trim().toLowerCase() === targetKey
    );
    const delta = currentItem ? quantity - currentItem.quantity : 0;

    setItems((current) =>
      current.map((item) =>
        String(item.id ?? "").trim().toLowerCase() === targetKey ? { ...item, quantity } : item
      )
    );
    if (delta !== 0) {
      void updateCartItemDeltaInApi(productId, delta).catch(() => {
        // Keep local fallback if API/session is unavailable.
      });
    }
  }, [items]);

  const removeItem = useCallback((productId: string) => {
    const targetKey = String(productId ?? "").trim().toLowerCase();
    setItems((current) =>
      current.filter((item) => String(item.id ?? "").trim().toLowerCase() !== targetKey)
    );
    void removeCartItemFromApi(productId).catch(() => {
      // Keep local fallback if API/session is unavailable.
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    void clearCartInApi().catch(() => {
      // Keep local fallback if API/session is unavailable.
    });
  }, []);

  const resetLocalCart = useCallback(() => {
    setItems([]);
    void AsyncStorage.removeItem(CART_STORAGE_KEY).catch(console.error);
  }, []);

  const replaceCartItems = useCallback(async (nextItems: CartItem[]) => {
    setItems(nextItems);
    try {
      await clearCartInApi();
      for (const item of nextItems) {
        await addCartItemToApi(item.id, item.quantity, item.price);
      }
    } catch {
      // Keep local cart for checkout even if API sync fails.
    }
  }, []);

  const itemCount = useMemo(
    () => items.reduce((total, item) => total + item.quantity, 0),
    [items]
  );

  const subtotal = useMemo(
    () => items.reduce((total, item) => total + item.price * item.quantity, 0),
    [items]
  );

  const taxTotal = useMemo(() => getCartTaxTotal(items, taxRules), [items, taxRules]);
  const getItemTax = useCallback((item: CartItem) => getCartItemTax(item, taxRules), [taxRules]);
  const getItemVatPercent = useCallback(
    (item: CartItem) => getCartItemVatPercent(item, taxRules),
    [taxRules],
  );

  const value = useMemo(
    () => ({
      items,
      itemCount,
      subtotal,
      taxTotal,
      getItemTax,
      getItemVatPercent,
      isHydrated,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      resetLocalCart,
      replaceCartItems,
      refreshCart,
    }),
    [
      items,
      itemCount,
      subtotal,
      taxTotal,
      getItemTax,
      getItemVatPercent,
      isHydrated,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      resetLocalCart,
      replaceCartItems,
      refreshCart,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}

export function getShippingFee(subtotal: number): number {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
}

export function isStandardShippingOption(
  option: { name?: string; code?: string } | null | undefined,
) {
  const label = `${option?.code ?? ""} ${option?.name ?? ""}`.trim().toLowerCase();
  return label.includes("standard");
}

export function getCheckoutShippingFee(
  subtotal: number,
  option: { name?: string; code?: string; price?: number } | null | undefined,
): number {
  const price = option?.price ?? 0;
  if (subtotal >= FREE_SHIPPING_THRESHOLD && isStandardShippingOption(option)) {
    return 0;
  }
  return price;
}

export function getCartTotal(subtotal: number, taxTotal = 0): number {
  return subtotal + taxTotal + getShippingFee(subtotal);
}
