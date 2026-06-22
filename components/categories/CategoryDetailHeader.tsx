import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type CategoryDetailHeaderProps = {
  title: string;
};

export default function CategoryDetailHeader({ title }: CategoryDetailHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      className="bg-white border-b border-[#F0F0F0]"
      style={{ paddingTop: insets.top + 8, paddingBottom: 12 }}
    >
      <View className="flex-row items-center px-4">
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          className="w-9 h-9 justify-center items-center"
        >
          <Ionicons name="chevron-back" size={26} color="#333333" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-[17px] font-bold text-black mr-9">
          {title}
        </Text>
      </View>
    </View>
  );
}
