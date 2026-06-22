import { Image } from "expo-image";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

export type MessageItem = {
  id: string;
  name: string;
  preview: string;
  time: string;
  avatarUri?: string;
  isOnline?: boolean;
  unreadCount?: number;
  isBlocked?: boolean;
};

type MessageListItemProps = {
  item: MessageItem;
  onPress?: () => void;
  showDivider?: boolean;
};

export default function MessageListItem({
  item,
  onPress,
  showDivider = true,
}: MessageListItemProps) {
  const hasUnread = (item.unreadCount ?? 0) > 0;

  return (
    <>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        className="flex-row items-center px-5 py-4 bg-white"
      >
        <View className="relative mr-3">
          {item.avatarUri ? (
            <Image
              source={{ uri: item.avatarUri }}
              style={{ width: 52, height: 52, borderRadius: 26 }}
              contentFit="cover"
            />
          ) : (
            <View className="w-[52px] h-[52px] rounded-full bg-[#F3F4F6] justify-center items-center">
              <Text className="text-[#9CA3AF] text-lg font-semibold">
                {item.name.charAt(0)}
              </Text>
            </View>
          )}
          {item.isOnline && !item.isBlocked ? (
            <View className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-[#22C55E] border-2 border-white" />
          ) : null}
        </View>

        <View className="flex-1 mr-3">
          <View className="flex-row items-center flex-wrap gap-1.5">
            <Text className="text-[15px] font-semibold text-black" numberOfLines={1}>
              {item.name}
            </Text>
            {item.isBlocked ? (
              <View className="bg-[#FEE2E2] rounded px-2 py-0.5">
                <Text className="text-[10px] font-semibold text-[#EF4444]">Blocked</Text>
              </View>
            ) : null}
          </View>
          <Text className="text-[13px] text-[#9CA3AF] mt-0.5" numberOfLines={1}>
            {item.preview}
          </Text>
        </View>

        <View className="items-end min-w-[56px]">
          <Text className="text-[12px] text-[#9CA3AF]">{item.time}</Text>
          {hasUnread && !item.isBlocked ? (
            <View className="mt-2 w-2.5 h-2.5 rounded-full bg-[#FF9800]" />
          ) : null}
        </View>
      </TouchableOpacity>
      {showDivider ? <View className="h-px bg-[#F0F0F0] ml-[84px]" /> : null}
    </>
  );
}
