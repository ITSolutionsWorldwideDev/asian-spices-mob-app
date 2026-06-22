import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

type PasswordFormFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  helperText?: string;
  placeholder?: string;
};

export default function PasswordFormField({
  label,
  value,
  onChangeText,
  helperText,
  placeholder,
}: PasswordFormFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View className="mb-5">
      <Text className="text-[14px] font-semibold text-[#374151] mb-2">{label}</Text>
      <View className="flex-row items-center bg-white border border-[#E5E7EB] rounded-xl px-4 h-[52px]">
        <TextInput
          className="flex-1 text-[15px] text-black"
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          onPress={() => setVisible((prev) => !prev)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={visible ? "eye-off-outline" : "eye-outline"}
            size={20}
            color="#9CA3AF"
          />
        </TouchableOpacity>
      </View>
      {helperText ? (
        <Text className="text-[13px] text-[#9CA3AF] mt-1.5">{helperText}</Text>
      ) : null}
    </View>
  );
}
