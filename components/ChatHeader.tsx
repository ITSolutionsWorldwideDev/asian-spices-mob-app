import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ChatHeaderProps = {
  name: string;
  avatarUri?: string;
  isOnline?: boolean;
  isBlocked?: boolean;
  onMenuPress?: () => void;
};

export default function ChatHeader({
  name,
  avatarUri,
  isOnline = false,
  isBlocked = false,
  onMenuPress,
}: ChatHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      className="bg-white border-b border-[#EBEBEB]"
      style={{ paddingTop: insets.top + 4 }}
    >
      <View className="flex-row items-center px-4 pb-3">
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          className="mr-2"
        >
          <Ionicons name="chevron-back" size={26} color="#333333" />
        </TouchableOpacity>

        <View className="relative mr-3">
          {avatarUri ? (
            <Image
              source={{ uri: avatarUri }}
              style={{ width: 40, height: 40, borderRadius: 20 }}
              contentFit="cover"
            />
          ) : (
            <View className="w-10 h-10 rounded-full bg-[#E5E7EB] justify-center items-center">
              <Text className="text-[#9CA3AF] font-semibold">{name.charAt(0)}</Text>
            </View>
          )}
          {isOnline && !isBlocked ? (
            <View className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#22C55E] border-2 border-white" />
          ) : null}
        </View>

        <View className="flex-1">
          <View className="flex-row items-center flex-wrap gap-1.5">
            <Text className="text-[15px] font-semibold text-black">{name}</Text>
            {isBlocked ? (
              <View className="bg-[#FEE2E2] rounded px-2 py-0.5">
                <Text className="text-[10px] font-semibold text-[#EF4444]">Blocked</Text>
              </View>
            ) : null}
          </View>
          {isOnline && !isBlocked ? (
            <Text className="text-[12px] text-[#22C55E] mt-0.5">Online</Text>
          ) : null}
        </View>

        <TouchableOpacity
          onPress={onMenuPress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="ellipsis-vertical" size={20} color="#333333" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
