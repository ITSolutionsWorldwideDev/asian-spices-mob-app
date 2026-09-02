import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Keyboard,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type ChatInputBarProps = {
  value: string;
  isLoading: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
};

export default function ChatInputBar({
  value,
  isLoading,
  onChange,
  onSubmit,
}: ChatInputBarProps) {
  return (
    <View className="border-t border-[#ece6dc] bg-white px-4 py-3">
      <View className="flex-row items-end gap-3 rounded-[28px] border border-[#ece6dc] bg-[#faf8f5] px-4 py-2">
        <TextInput
          value={value}
          onChangeText={onChange}
          editable={!isLoading}
          multiline
          placeholder="Ask Bibi about spices, recipes, or swaps"
          placeholderTextColor="#988b7e"
          className="max-h-[120px] min-h-[44px] flex-1 py-2 text-[15px] leading-6 text-[#5a4d44]"
          onSubmitEditing={() => {
            if (value.trim()) {
              Keyboard.dismiss();
              onSubmit();
            }
          }}
        />
        <TouchableOpacity
          onPress={onSubmit}
          disabled={isLoading || !value.trim()}
          activeOpacity={0.85}
          className="mb-1 h-11 w-11 items-center justify-center rounded-[14px] bg-[#b45534]"
          style={{ opacity: isLoading || !value.trim() ? 0.45 : 1 }}
        >
          <Ionicons name="send" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
