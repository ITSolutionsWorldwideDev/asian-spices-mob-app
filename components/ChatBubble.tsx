import { ChatMessage } from "@/data/conversations";
import React from "react";
import { Text, View } from "react-native";

type ChatBubbleProps = {
  message: ChatMessage;
};

export default function ChatBubble({ message }: ChatBubbleProps) {
  const isOutgoing = message.isOutgoing;

  return (
    <View
      className={`max-w-[82%] mb-1 ${isOutgoing ? "self-end items-end" : "self-start items-start"}`}
    >
      <View
        className={`px-4 py-3 ${
          isOutgoing
            ? "bg-[#FF9800]"
            : "bg-white border border-[#E8E8E8]"
        }`}
        style={{
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          borderBottomLeftRadius: isOutgoing ? 16 : 4,
          borderBottomRightRadius: isOutgoing ? 4 : 16,
        }}
      >
        <Text
          className={`text-[14px] leading-5 ${
            isOutgoing ? "text-white" : "text-[#333333]"
          }`}
        >
          {message.text}
        </Text>
      </View>
      <Text className="text-[11px] text-[#9CA3AF] mt-1 mb-3">{message.time}</Text>
    </View>
  );
}
