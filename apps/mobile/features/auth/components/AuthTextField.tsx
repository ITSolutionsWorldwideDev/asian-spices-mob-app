import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from "react-native";

type AuthTextFieldProps = TextInputProps & {
  icon: keyof typeof Ionicons.glyphMap;
  isPassword?: boolean;
};

export default function AuthTextField({
  icon,
  isPassword = false,
  ...props
}: AuthTextFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View className="flex-row items-center bg-[#FCF8F4] border border-[#E8E8E8] rounded-xl px-4 h-[52px]">
      <Ionicons name={icon} size={20} color="#9CA3AF" />
      <TextInput
        className="flex-1 ml-3 text-[15px] text-[#333333]"
        placeholderTextColor="#9CA3AF"
        secureTextEntry={isPassword && !visible}
        autoCapitalize="none"
        {...props}
      />
      {isPassword ? (
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
      ) : null}
    </View>
  );
}
