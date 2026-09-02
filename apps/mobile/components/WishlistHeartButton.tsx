import { useWishlist } from "@/contexts/WishlistContext";
import type { WishlistItem } from "@/types/wishlist";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Alert, TouchableOpacity, ViewStyle } from "react-native";

type WishlistHeartButtonProps = {
  item: WishlistItem;
  size?: number;
  style?: ViewStyle;
  className?: string;
};

export default function WishlistHeartButton({
  item,
  size = 16,
  style,
  className = "w-7 h-7 rounded-full bg-white/90 justify-center items-center",
}: WishlistHeartButtonProps) {
  const { isWishlisted, toggleWishlist } = useWishlist();
  const active = isWishlisted(item.id);

  return (
    <TouchableOpacity
      onPress={() => {
        toggleWishlist(item).catch((error) => {
          const message =
            error instanceof Error ? error.message : "Could not update wishlist.";
          Alert.alert("Wishlist", message);
        });
      }}
      className={className}
      style={style}
      activeOpacity={0.8}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
    >
      <Ionicons
        name={active ? "heart" : "heart-outline"}
        size={size}
        color={active ? "#EF4444" : "#6B7280"}
      />
    </TouchableOpacity>
  );
}
