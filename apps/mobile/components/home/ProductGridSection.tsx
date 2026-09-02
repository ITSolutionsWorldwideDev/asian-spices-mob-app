import type { Product } from "@/types/home";
import React from "react";
import { Text, View } from "react-native";
import ProductCard from "./ProductCard";
import SectionHeader from "./SectionHeader";

type ProductGridSectionProps = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onActionPress?: () => void;
  products: Product[];
  showBrand?: boolean;
  showOriginalPrice?: boolean;
  backgroundColor?: string;
  icon?: React.ComponentProps<typeof SectionHeader>["icon"];
  iconBg?: string;
  emptyMessage?: string;
};

export default function ProductGridSection({
  title,
  subtitle,
  actionLabel,
  onActionPress,
  products,
  showBrand = false,
  showOriginalPrice = false,
  backgroundColor = "transparent",
  icon,
  iconBg,
  emptyMessage,
}: ProductGridSectionProps) {
  const rows: Product[][] = [];
  for (let i = 0; i < products.length; i += 2) {
    rows.push(products.slice(i, i + 2));
  }

  return (
    <View style={{ backgroundColor }} className="py-4">
      <SectionHeader
        title={title}
        subtitle={subtitle}
        actionLabel={actionLabel}
        onActionPress={onActionPress}
        icon={icon}
        iconBg={iconBg}
      />
      <View className="px-4">
        {products.length === 0 && emptyMessage ? (
          <View className="bg-white border border-[#F0F0F0] rounded-2xl p-5">
            <Text className="text-[#9CA3AF] text-sm text-center">{emptyMessage}</Text>
          </View>
        ) : (
          rows.map((row, rowIndex) => (
            <View key={rowIndex} className="flex-row gap-3">
              {row.map((product) => (
                <View key={product.id} className="flex-1">
                  <ProductCard
                    product={product}
                    showBrand={showBrand}
                    showOriginalPrice={showOriginalPrice}
                  />
                </View>
              ))}
              {row.length === 1 ? <View className="flex-1" /> : null}
            </View>
          ))
        )}
      </View>
    </View>
  );
}
