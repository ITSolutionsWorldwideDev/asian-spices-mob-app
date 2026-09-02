import type { OrderTimelineStep } from "@/types/order";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";

type OrderTimelineProps = {
  steps: OrderTimelineStep[];
};

export default function OrderTimeline({ steps }: OrderTimelineProps) {
  return (
    <View>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const isCompleted = step.state === "completed";
        const isCurrent = step.state === "current";

        const circleColor = isCompleted
          ? "#22C55E"
          : isCurrent
            ? "#FF9800"
            : "#E5E7EB";
        const lineColor = isCompleted ? "#22C55E" : "#E5E7EB";
        const titleColor = isCurrent ? "#FF9800" : "#111827";

        return (
          <View key={step.id} className="flex-row">
            <View className="items-center mr-3">
              <View
                className="w-8 h-8 rounded-full justify-center items-center"
                style={{ backgroundColor: circleColor }}
              >
                {isCompleted || isCurrent ? (
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                ) : (
                  <View className="w-2.5 h-2.5 rounded-full bg-white" />
                )}
              </View>
              {!isLast ? (
                <View className="w-0.5 flex-1 my-1" style={{ backgroundColor: lineColor, minHeight: 40 }} />
              ) : null}
            </View>

            <View className={`flex-1 ${isLast ? "" : "pb-5"}`}>
              <View className="flex-row items-center justify-between">
                <Text className="text-base font-semibold" style={{ color: titleColor }}>
                  {step.title}
                </Text>
                {isCurrent ? (
                  <View className="bg-[#FFF7ED] rounded-full px-2.5 py-0.5">
                    <Text className="text-[#FF9800] text-[11px] font-semibold">Current</Text>
                  </View>
                ) : null}
              </View>
              {step.timestamp ? (
                <Text className="text-[#9CA3AF] text-xs mt-1">{step.timestamp}</Text>
              ) : null}
              <Text className="text-[#6B7280] text-sm mt-1">{step.description}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}
