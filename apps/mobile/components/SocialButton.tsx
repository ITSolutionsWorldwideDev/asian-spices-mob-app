import React from "react";
import { TouchableOpacity } from "react-native";

export default function SocialButton({
  children,
  onPress,
}: {
  children: React.ReactNode;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="w-[52px] h-[52px] rounded-full border-2 border-[#FF9800] bg-white justify-center items-center"
    >
      {children}
    </TouchableOpacity>
  );
}
