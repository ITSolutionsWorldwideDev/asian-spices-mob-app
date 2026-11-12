import { Ionicons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";

type SuccessPopupProps = {
  visible: boolean;
  message: string;
  onClose: () => void;
  onOk: () => void;
  autoCloseMs?: number;
};

export default function SuccessPopup({
  visible,
  message,
  onClose,
  onOk,
  autoCloseMs,
}: SuccessPopupProps) {
  useEffect(() => {
    if (!visible || !autoCloseMs) return;

    const timer = setTimeout(onClose, autoCloseMs);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only reset timer when visibility changes
  }, [visible, autoCloseMs]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        className="flex-1 bg-black/40 justify-center items-center px-8"
      >
        <TouchableOpacity activeOpacity={1} onPress={(event) => event.stopPropagation()}>
          <View className="bg-white rounded-2xl px-6 py-6 items-center w-[280px]">
            <View className="w-16 h-16 rounded-full bg-[#D1FAE5] justify-center items-center mb-4">
              <View className="w-10 h-10 rounded-full bg-[#22C55E] justify-center items-center">
                <Ionicons name="checkmark" size={24} color="#FFFFFF" />
              </View>
            </View>
            <Text className="text-black text-lg font-bold text-center">{message}</Text>
            <Text className="text-[#6B7280] text-sm text-center mt-2">
              Your item has been added to the cart.
            </Text>
            <TouchableOpacity
              onPress={onOk}
              className="bg-[#FF9800] rounded-xl px-8 py-3 mt-5 w-full"
              activeOpacity={0.85}
            >
              <Text className="text-white text-base font-semibold text-center">OK</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
