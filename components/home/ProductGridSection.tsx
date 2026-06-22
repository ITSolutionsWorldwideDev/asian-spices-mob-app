import type { Product } from "@/types/home";
import React from "react";
import { View } from "react-native";
import ProductCard from "./ProductCard";
import SectionHeader from "./SectionHeader";

type ProductGridSectionProps = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  products: Product[];
  showBrand?: boolean;
  backgroundColor?: string;
  icon?: React.ComponentProps<typeof SectionHeader>["icon"];
  iconBg?: string;
};

export default function ProductGridSection({
  title,
  subtitle,
  actionLabel,
  products,
  showBrand = false,
  backgroundColor = "transparent",
  icon,
  iconBg,
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
        icon={icon}
        iconBg={iconBg}
      />
      <View className="px-4">
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} className="flex-row gap-3">
            {row.map((product) => (
              <View key={product.id} className="flex-1">
                <ProductCard product={product} showBrand={showBrand} />
              </View>
            ))}
            {row.length === 1 ? <View className="flex-1" /> : null}
          </View>
        ))}
      </View>
    </View>
  );
}
