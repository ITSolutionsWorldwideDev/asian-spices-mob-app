import DrawerMenu from "@/components/DrawerMenu";
import PushNotificationsBootstrap from "@/components/PushNotificationsBootstrap";
import { CartProvider } from "@/contexts/CartContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { MenuDrawerProvider } from "@/contexts/MenuDrawerContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";

export default function RootLayout() {
  return (
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
  );
}
