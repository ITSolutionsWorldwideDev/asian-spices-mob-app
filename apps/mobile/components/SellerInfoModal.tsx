import type { ProductSeller } from "@/types/seller";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type SellerInfoModalProps = {
  visible: boolean;
  seller: ProductSeller | null;
  loading: boolean;
  error?: string | null;
  onClose: () => void;
};

export default function SellerInfoModal({
  visible,
  seller,
  loading,
  error,
  onClose,
}: SellerInfoModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        className="flex-1 bg-black/40 justify-center items-center px-6"
      >
        <TouchableOpacity activeOpacity={1} onPress={(event) => event.stopPropagation()}>
          <View className="bg-white rounded-2xl px-5 py-5 w-[320px]">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-black text-lg font-bold">Seller</Text>
              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {loading ? (
              <View className="py-8 items-center">
                <ActivityIndicator size="small" color="#FF9800" />
              </View>
            ) : error ? (
              <Text className="text-[#6B7280] text-sm text-center py-4">{error}</Text>
            ) : seller ? (
              <View className="flex-row items-center py-2">
                <View className="w-12 h-12 rounded-full bg-[#FFF3E0] justify-center items-center mr-3">
                  <Ionicons name="storefront-outline" size={24} color="#FF9800" />
                </View>
                <Text className="flex-1 text-black text-base font-bold">{seller.name}</Text>
              </View>
            ) : null}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
