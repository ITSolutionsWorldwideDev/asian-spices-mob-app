import { CartProvider } from "@/features/cart/contexts/CartContext";
import { WishlistProvider } from "@/features/wishlist/contexts/WishlistContext";
import { store } from "@/shared/services/api/store";
import { CurrencyProvider } from "@/shared/providers/CurrencyProvider";
import { MenuDrawerProvider } from "@/shared/providers/MenuDrawerProvider";
import React from "react";
import { Provider } from "react-redux";
import { SafeAreaProvider } from "react-native-safe-area-context";

type AppProvidersProps = {
  children: React.ReactNode;
};

export default function AppProviders({ children }: AppProvidersProps) {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <CurrencyProvider>
          <WishlistProvider>
            <CartProvider>
              <MenuDrawerProvider>{children}</MenuDrawerProvider>
            </CartProvider>
          </WishlistProvider>
        </CurrencyProvider>
      </SafeAreaProvider>
    </Provider>
  );
}
