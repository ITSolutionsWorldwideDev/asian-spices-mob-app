import { getStoredAuthUser } from "@/features/auth/services/authService";
import {
  addWishlistItemToApi,
  fetchWishlistItemsFromApi,
  removeWishlistItemFromApi,
  syncLocalWishlistToApi,
} from "@/features/wishlist/services/wishlistService";
import type { WishlistItem } from "@/features/wishlist/types/wishlist";
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
  toggleWishlist: (item: WishlistItem) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  refreshWishlist: () => Promise<void>;
  resetLocalWishlist: () => void;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  const refreshWishlist = useCallback(async () => {
    const localRaw = await AsyncStorage.getItem(WISHLIST_STORAGE_KEY);
    const localItems = localRaw ? (JSON.parse(localRaw) as WishlistItem[]) : [];
    const authUser = await getStoredAuthUser();

    // Without login, keep/clear local cache only — API returns [] for guests.
    if (!authUser) {
      setItems(localItems);
      return;
    }

    try {
      const apiItems = await fetchWishlistItemsFromApi();
      const apiIds = new Set(apiItems.map((item) => item.id));
      const localOnly = localItems.filter((item) => !apiIds.has(item.id));

      // Only push items that exist locally but not yet in DB.
      if (localOnly.length > 0) {
        await syncLocalWishlistToApi(localOnly);
        const merged = await fetchWishlistItemsFromApi();
        setItems(merged);
        await AsyncStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(merged));
        return;
      }

      setItems(apiItems);
      await AsyncStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(apiItems));
    } catch {
      // Keep last known items when API is unreachable.
      if (localItems.length > 0) {
        setItems(localItems);
      }
    }
  }, []);

  useEffect(() => {
    refreshWishlist()
      .catch(console.error)
      .finally(() => setIsHydrated(true));
  }, [refreshWishlist]);

  const isWishlisted = useCallback(
    (productId: string | number) => {
      const target = String(productId ?? "").trim().toLowerCase();
      if (!target) return false;
      return items.some(
        (item) => String(item.id ?? "").trim().toLowerCase() === target
      );
    },
    [items],
  );

  const toggleWishlist = useCallback(
    async (item: WishlistItem) => {
      const target = String(item.id ?? "").trim().toLowerCase();
      const exists = items.some(
        (entry) => String(entry.id ?? "").trim().toLowerCase() === target
      );

      const nextItems = exists
        ? items.filter((entry) => String(entry.id ?? "").trim().toLowerCase() !== target)
        : [...items, { ...item, id: String(item.id).trim() }];

      setItems(nextItems);
      await AsyncStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(nextItems)).catch(console.error);

      try {
        const authUser = await getStoredAuthUser();
        if (authUser) {
          if (exists) {
            await removeWishlistItemFromApi(String(item.id).trim());
          } else {
            await addWishlistItemToApi(String(item.id).trim());
          }
          const apiItems = await fetchWishlistItemsFromApi();
          setItems(apiItems);
          await AsyncStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(apiItems)).catch(console.error);
        }
      } catch (error) {
        console.warn("[Wishlist] Remote sync warning:", error);
      }
    },
    [items],
  );

  const removeFromWishlist = useCallback(async (productId: string | number) => {
    const target = String(productId ?? "").trim().toLowerCase();
    const nextItems = items.filter(
      (item) => String(item.id ?? "").trim().toLowerCase() !== target
    );
    setItems(nextItems);
    await AsyncStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(nextItems)).catch(console.error);

    try {
      const authUser = await getStoredAuthUser();
      if (authUser) {
        await removeWishlistItemFromApi(String(productId).trim());
        const apiItems = await fetchWishlistItemsFromApi();
        setItems(apiItems);
        await AsyncStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(apiItems)).catch(console.error);
      }
    } catch (error) {
      console.warn("[Wishlist] Remote remove warning:", error);
    }
  }, [items]);

  // Clears UI/local cache only. DB wishlist stays intact for next login.
  const resetLocalWishlist = useCallback(() => {
    setItems([]);
    AsyncStorage.removeItem(WISHLIST_STORAGE_KEY).catch(console.error);
  }, []);

  const value = useMemo(
    () => ({
      items,
      isHydrated,
      isWishlisted,
      toggleWishlist,
      removeFromWishlist,
      refreshWishlist,
      resetLocalWishlist,
    }),
    [
      items,
      isHydrated,
      isWishlisted,
      toggleWishlist,
      removeFromWishlist,
      refreshWishlist,
      resetLocalWishlist,
    ],
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
