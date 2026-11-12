import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

const PROMPTS = [
  {
    title: "Recipe Ideas",
    subtitle: "Help me find a chicken dinner",
    prompt: "I want help finding a recipe.",
  },
  {
    title: "Find Products",
    subtitle: "Help me find the right spices",
    prompt: "I want help finding products.",
  },
  {
    title: "Build My Dish",
    subtitle: "Find the spices and staples for me",
    prompt: "I want help building a dish.",
  },
  {
    title: "Shop by Dish",
    subtitle: "Show me products for one recipe",
    prompt: "I want to shop for a dish.",
  },
];

type ChatQuickPromptsProps = {
  disabled?: boolean;
  onSelect: (value: string) => void;
};

export default function ChatQuickPrompts({
  disabled = false,
  onSelect,
}: ChatQuickPromptsProps) {
  return (
    <View className="px-2 pb-4 pt-2">
      <Text className="px-1 mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9a7256]">
        Try one of these
      </Text>
      <View className="gap-3">
        {PROMPTS.map((item) => (
          <TouchableOpacity
            key={item.title}
            disabled={disabled}
            activeOpacity={0.85}
            onPress={() => onSelect(item.prompt)}
            className="rounded-[22px] border border-[#f0e8de] bg-[#fffbf6] px-4 py-3"
            style={{ opacity: disabled ? 0.55 : 1 }}
          >
            <Text className="text-[15px] font-semibold text-[#4f443c]">{item.title}</Text>
            <Text className="mt-1 text-sm leading-6 text-[#7b6a5d]">{item.subtitle}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
