import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Modal, Pressable, Text, TouchableOpacity, View } from "react-native";

type ChatOptionsMenuProps = {
  visible: boolean;
  isMuted: boolean;
  onClose: () => void;
  onMute: () => void;
  onBlock: () => void;
  onReport: () => void;
  onDelete: () => void;
};

export default function ChatOptionsMenu({
  visible,
  isMuted,
  onClose,
  onMute,
  onBlock,
  onReport,
  onDelete,
}: ChatOptionsMenuProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1" onPress={onClose}>
        <View className="flex-1 justify-start items-end pt-28 pr-4">
          <Pressable
            onPress={(event) => event.stopPropagation()}
            className="bg-white rounded-xl shadow-lg min-w-[200px] py-1 border border-[#F0F0F0]"
          >
            <TouchableOpacity
              onPress={() => {
                onMute();
                onClose();
              }}
              className="flex-row items-center px-4 py-3.5"
              activeOpacity={0.7}
            >
              <Ionicons
                name={isMuted ? "notifications" : "notifications-off-outline"}
                size={18}
                color="#333333"
              />
              <Text className="text-[14px] text-[#333333] ml-3">
                {isMuted ? "Unmute notifications" : "Mute notifications"}
              </Text>
            </TouchableOpacity>

            <View className="h-px bg-[#F0F0F0]" />

            <TouchableOpacity
              onPress={() => {
                onBlock();
                onClose();
              }}
              className="flex-row items-center px-4 py-3.5"
              activeOpacity={0.7}
            >
              <Ionicons name="ban-outline" size={18} color="#333333" />
              <Text className="text-[14px] text-[#333333] ml-3">Block vendor</Text>
            </TouchableOpacity>

            <View className="h-px bg-[#F0F0F0]" />

            <TouchableOpacity
              onPress={() => {
                onReport();
                onClose();
              }}
              className="flex-row items-center px-4 py-3.5"
              activeOpacity={0.7}
            >
              <Ionicons name="flag-outline" size={18} color="#333333" />
              <Text className="text-[14px] text-[#333333] ml-3">Report chat</Text>
            </TouchableOpacity>

            <View className="h-px bg-[#F0F0F0]" />

            <TouchableOpacity
              onPress={() => {
                onDelete();
                onClose();
              }}
              className="flex-row items-center px-4 py-3.5"
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
              <Text className="text-[14px] text-[#EF4444] ml-3">Delete chat</Text>
            </TouchableOpacity>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}
