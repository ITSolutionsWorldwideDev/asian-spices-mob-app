import DrawerMenu from "@/shared/components/DrawerMenu";
import PushNotificationsBootstrap from "@/shared/components/PushNotificationsBootstrap";
import { CartProvider } from "@/features/cart/contexts/CartContext";
import { CurrencyProvider } from "@/shared/contexts/CurrencyContext";
import { MenuDrawerProvider } from "@/shared/contexts/MenuDrawerContext";
import { WishlistProvider } from "@/features/wishlist/contexts/WishlistContext";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider } from "react-redux";
import { store } from "@/shared/services/api/store";
import "../global.css";

export default function RootLayout() {
  return (
    <Provider store={store}>
    <SafeAreaProvider>
      <StatusBar style={Platform.OS === "android" ? "dark" : "auto"} />
      <CurrencyProvider>
        <WishlistProvider>
          <CartProvider>
            <MenuDrawerProvider>
              <PushNotificationsBootstrap />
              <Stack screenOptions={{ headerShown: false }} />
              <DrawerMenu />
            </MenuDrawerProvider>
          </CartProvider>
        </WishlistProvider>
      </CurrencyProvider>
    </SafeAreaProvider>
    </Provider>
  );
}
