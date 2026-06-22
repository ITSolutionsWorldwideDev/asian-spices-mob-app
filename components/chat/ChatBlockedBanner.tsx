import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

type ChatBlockedBannerProps = {
  onUnblock: () => void;
};

export default function ChatBlockedBanner({ onUnblock }: ChatBlockedBannerProps) {
  return (
    <View className="bg-[#FEE2E2] px-4 py-3 flex-row items-center justify-between">
      <Text className="flex-1 text-[13px] text-[#B91C1C] leading-5 mr-3">
        You have blocked this vendor. Unblock to send messages.
      </Text>
      <TouchableOpacity onPress={onUnblock} activeOpacity={0.8}>
        <Text className="text-[13px] font-semibold text-[#EF4444]">Unblock</Text>
      </TouchableOpacity>
    </View>
  );
}
