import type { WishlistItem } from "@/types/wishlist";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const WISHLIST_STORAGE_KEY = "@asian_spices_wishlist";

type WishlistContextValue = {
  items: WishlistItem[];
  isHydrated: boolean;
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (productId: string) => void;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(WISHLIST_STORAGE_KEY)
      .then((stored) => {
        if (stored) {
          setItems(JSON.parse(stored) as WishlistItem[]);
        }
      })
      .catch(console.error)
      .finally(() => setIsHydrated(true));
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    AsyncStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items)).catch(console.error);
  }, [items, isHydrated]);

  const isWishlisted = useCallback(
    (productId: string) => items.some((item) => item.id === productId),
    [items]
  );

  const toggleWishlist = useCallback((item: WishlistItem) => {
    setItems((current) => {
      const exists = current.some((entry) => entry.id === item.id);
      if (exists) {
        return current.filter((entry) => entry.id !== item.id);
      }
      return [...current, item];
    });
  }, []);

  const removeFromWishlist = useCallback((productId: string) => {
    setItems((current) => current.filter((item) => item.id !== productId));
  }, []);

  const value = useMemo(
    () => ({
      items,
      isHydrated,
      isWishlisted,
      toggleWishlist,
      removeFromWishlist,
    }),
    [items, isHydrated, isWishlisted, toggleWishlist, removeFromWishlist]
  );

  return (
    <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within WishlistProvider");
  }
  return context;
}

export function toWishlistItem(product: {
  id: string;
  name: string;
  image: string;
  price: number;
  originalPrice?: number;
}): WishlistItem {
  return {
    id: product.id,
    name: product.name,
    image: product.image,
    price: product.price,
    originalPrice: product.originalPrice,
  };
}
