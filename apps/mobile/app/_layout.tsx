import DrawerMenu from "@/shared/components/DrawerMenu";
import PushNotificationsBootstrap from "@/shared/components/PushNotificationsBootstrap";
import AppProviders from "@/shared/providers/AppProviders";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Platform } from "react-native";
import "../global.css";

export default function RootLayout() {
  return (
    <AppProviders>
      <StatusBar style={Platform.OS === "android" ? "dark" : "auto"} />
      <PushNotificationsBootstrap />
      <Stack screenOptions={{ headerShown: false }} />
      <DrawerMenu />
    </AppProviders>
  );
}
