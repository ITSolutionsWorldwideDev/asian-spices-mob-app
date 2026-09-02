import { Image } from "expo-image";
import React from "react";
import { View } from "react-native";

type BibiLogoAvatarProps = {
  size?: number;
};

export default function BibiLogoAvatar({ size = 44 }: BibiLogoAvatarProps) {
  return (
    <View
      className="overflow-hidden rounded-full bg-[#f6efe1]"
      style={{
        width: size,
        height: size,
        shadowColor: "#5f3d25",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      <Image
        source={require("@/assets/images/image.png")}
        style={{ width: size, height: size }}
        contentFit="contain"
        accessibilityLabel="Bibi assistant"
      />
    </View>
  );
}
