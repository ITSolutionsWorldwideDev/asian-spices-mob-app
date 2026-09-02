import BibiLogoAvatar from "@/components/chatbot/BibiLogoAvatar";
import React, { useEffect, useRef } from "react";
import { Animated, Text, View } from "react-native";

type ChatTypingIndicatorProps = {
  phase: "sending" | "thinking";
};

export default function ChatTypingIndicator({ phase }: ChatTypingIndicatorProps) {
  const dotOne = useRef(new Animated.Value(0.35)).current;
  const dotTwo = useRef(new Animated.Value(0.35)).current;
  const dotThree = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const dots = [dotOne, dotTwo, dotThree];
    const animations = dots.map((dot, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 120),
          Animated.timing(dot, {
            toValue: 1,
            duration: 410,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.35,
            duration: 410,
            useNativeDriver: true,
          }),
        ]),
      ),
    );

    animations.forEach((animation) => animation.start());
    return () => {
      animations.forEach((animation) => animation.stop());
    };
  }, [dotOne, dotTwo, dotThree]);

  return (
    <View className="flex-row items-start gap-3 px-4 pb-3 pt-1">
      <BibiLogoAvatar size={44} />
      <View className="max-w-[85%] rounded-[22px] border border-[#ece6dc] bg-white px-4 py-3">
        <Text className="mb-2 text-[15px] leading-7 text-[#4f443c]">
          {phase === "sending"
            ? "Sending your message..."
            : "Bibi is cooking up a lovely answer for you, dear."}
        </Text>
        <View className="flex-row items-center gap-2">
          {[dotOne, dotTwo, dotThree].map((dot, index) => (
            <Animated.View
              key={index}
              style={{
                opacity: dot,
                transform: [
                  {
                    translateY: dot.interpolate({
                      inputRange: [0.35, 1],
                      outputRange: [4, -4],
                    }),
                  },
                ],
              }}
              className="h-3 w-3 rounded-full bg-[#c46b45]"
            />
          ))}
        </View>
      </View>
    </View>
  );
}
