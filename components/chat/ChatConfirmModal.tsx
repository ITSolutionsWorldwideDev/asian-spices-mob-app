import React from "react";
import { Modal, Pressable, Text, TouchableOpacity, View } from "react-native";

type ChatConfirmModalProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  confirmColor?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ChatConfirmModal({
  visible,
  title,
  message,
  confirmLabel,
  confirmColor = "#EF4444",
  onCancel,
  onConfirm,
}: ChatConfirmModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable
        className="flex-1 bg-black/40 justify-center items-center px-8"
        onPress={onCancel}
      >
        <Pressable
          onPress={(event) => event.stopPropagation()}
          className="bg-white rounded-2xl w-full max-w-[320px] px-5 py-5"
        >
          <Text className="text-[17px] font-bold text-black text-center">{title}</Text>
          <Text className="text-[14px] text-[#6B7280] text-center mt-3 leading-5">
            {message}
          </Text>

          <View className="flex-row gap-3 mt-6">
            <TouchableOpacity
              onPress={onCancel}
              className="flex-1 h-11 rounded-xl bg-[#F3F4F6] justify-center items-center"
              activeOpacity={0.8}
            >
              <Text className="text-[14px] font-semibold text-[#6B7280]">Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onConfirm}
              className="flex-1 h-11 rounded-xl justify-center items-center"
              style={{ backgroundColor: confirmColor }}
              activeOpacity={0.8}
            >
              <Text className="text-[14px] font-semibold text-white">{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
