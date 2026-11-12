import React from "react";
import { Text, TextInput, TextInputProps, View } from "react-native";

type ProfileFormFieldProps = TextInputProps & {
  label: string;
  helperText?: string;
  multiline?: boolean;
};

export default function ProfileFormField({
  label,
  helperText,
  multiline = false,
  ...props
}: ProfileFormFieldProps) {
  return (
    <View className="mb-5">
      <Text className="text-[14px] font-semibold text-[#374151] mb-2">{label}</Text>
      <TextInput
        className={`bg-white border border-[#E5E7EB] rounded-xl px-4 text-[15px] text-black ${
          multiline ? "min-h-[100px] py-3" : "h-[52px]"
        }`}
        placeholderTextColor="#9CA3AF"
        textAlignVertical={multiline ? "top" : "center"}
        multiline={multiline}
        {...props}
      />
      {helperText ? (
        <Text className="text-[13px] text-[#9CA3AF] mt-1.5">{helperText}</Text>
      ) : null}
    </View>
  );
}
