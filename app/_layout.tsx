import DrawerMenu from "@/components/DrawerMenu";
import { CartProvider } from "@/contexts/CartContext";
import { ChatProvider } from "@/contexts/ChatContext";
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
      <WishlistProvider>
        <CartProvider>
          <ChatProvider>
            <MenuDrawerProvider>
              <Stack screenOptions={{ headerShown: false }} />
              <DrawerMenu />
            </MenuDrawerProvider>
          </ChatProvider>
        </CartProvider>
      </WishlistProvider>
    </SafeAreaProvider>
  );
}
