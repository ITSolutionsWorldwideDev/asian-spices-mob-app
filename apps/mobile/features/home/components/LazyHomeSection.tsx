import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, View, type LayoutChangeEvent } from "react-native";

const LOAD_AHEAD = 320;

type LazyHomeSectionProps = {
  scrollY: number;
  viewportHeight: number;
  onLoad: () => void;
  loading?: boolean;
  loaded?: boolean;
  minHeight?: number;
  children: React.ReactNode;
};

export default function LazyHomeSection({
  scrollY,
  viewportHeight,
  onLoad,
  loading = false,
  loaded = false,
  minHeight = 120,
  children,
}: LazyHomeSectionProps) {
  const [layoutY, setLayoutY] = useState(0);
  const triggeredRef = useRef(false);

  useEffect(() => {
    if (triggeredRef.current || loaded) return;
    if (layoutY <= scrollY + viewportHeight + LOAD_AHEAD) {
      triggeredRef.current = true;
      onLoad();
    }
  }, [scrollY, layoutY, viewportHeight, onLoad, loaded]);

  const handleLayout = (event: LayoutChangeEvent) => {
    setLayoutY(event.nativeEvent.layout.y);
  };

  if (!loaded) {
    return (
      <View
        onLayout={handleLayout}
        className="justify-center items-center"
        style={{ minHeight }}
      >
        {loading ? <ActivityIndicator size="small" color="#FF9800" /> : null}
      </View>
    );
  }

  return <View onLayout={handleLayout}>{children}</View>;
}
