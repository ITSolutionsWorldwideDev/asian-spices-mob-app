import AppHeader from "@/components/AppHeader";
import ReelFeedItem from "@/components/reels/ReelFeedItem";
import UploadReelModal from "@/components/reels/UploadReelModal";
import { getReels, uploadReel } from "@/services/reelService";
import type { ReelItem } from "@/types/reel";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  LayoutChangeEvent,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
} from "react-native";

function getReelIndex(reels: ReelItem[], reelId?: string) {
  if (!reelId) return 0;
  const index = reels.findIndex((reel) => reel.id === reelId);
  return index >= 0 ? index : 0;
}

export default function ReelsScreen() {
  const { reelId } = useLocalSearchParams<{ reelId?: string }>();
  const [reels, setReels] = useState<ReelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeReelId, setActiveReelId] = useState<string | null>(null);
  const [uploadVisible, setUploadVisible] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [reelAreaHeight, setReelAreaHeight] = useState(0);
  const listRef = useRef<FlatList<ReelItem>>(null);
  const ignoreViewabilityRef = useRef(false);
  const pendingReelIdRef = useRef<string | undefined>(reelId);

  const loadReels = useCallback(async () => {
    try {
      const data = await getReels();
      setReels(data);

      const targetId = pendingReelIdRef.current;
      if (targetId && data.some((reel) => reel.id === targetId)) {
        setActiveReelId(targetId);
      } else if (data[0]) {
        setActiveReelId(data[0].id);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    pendingReelIdRef.current = reelId;
    loadReels();
  }, [loadReels, reelId]);

  useEffect(() => {
    if (!showSuccess) return;
    const timer = setTimeout(() => setShowSuccess(false), 3500);
    return () => clearTimeout(timer);
  }, [showSuccess]);

  const scrollToReelId = useCallback(
    (targetReelId: string, animated = false) => {
      if (reelAreaHeight === 0 || reels.length === 0) return;

      const index = getReelIndex(reels, targetReelId);
      if (index < 0) return;

      ignoreViewabilityRef.current = true;
      setActiveReelId(targetReelId);
      listRef.current?.scrollToOffset({
        offset: reelAreaHeight * index,
        animated,
      });

      setTimeout(() => {
        ignoreViewabilityRef.current = false;
      }, 700);
    },
    [reelAreaHeight, reels]
  );

  useFocusEffect(
    useCallback(() => {
      if (!reelId || reels.length === 0) return;

      pendingReelIdRef.current = reelId;
      setActiveReelId(reelId);
      scrollToReelId(reelId);
    }, [reelId, reels, scrollToReelId])
  );

  useEffect(() => {
    if (!reelId || reels.length === 0 || reelAreaHeight === 0) return;
    setActiveReelId(reelId);
    scrollToReelId(reelId);
  }, [reelId, reels, reelAreaHeight, scrollToReelId]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (ignoreViewabilityRef.current) return;

      const visibleReel = viewableItems[0]?.item as ReelItem | undefined;
      if (visibleReel?.id) {
        setActiveReelId(visibleReel.id);
      }
    }
  ).current;

  const handleUpload = async (input: Parameters<typeof uploadReel>[0]) => {
    await uploadReel(input);
    pendingReelIdRef.current = undefined;
    await loadReels();
    setShowSuccess(true);
    if (reels[0]) {
      setActiveReelId(reels[0].id);
      scrollToReelId(reels[0].id, true);
    }
  };

  const onReelAreaLayout = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    if (height > 0 && height !== reelAreaHeight) {
      setReelAreaHeight(height);
    }
  };

  const activeIndex = reels.findIndex((reel) => reel.id === activeReelId);

  if (loading) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size="large" color="#FF9800" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <AppHeader searchPlaceholder="Search spices, recipes..." />

      {showSuccess ? (
        <View className="bg-[#D1FAE5] px-4 py-3 flex-row items-center border-b border-[#A7F3D0]">
          <View className="w-6 h-6 rounded-full bg-[#22C55E] justify-center items-center mr-2">
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          </View>
          <Text className="text-[#166534] text-sm font-medium flex-1">
            Recipe reel uploaded successfully!
          </Text>
        </View>
      ) : null}

      <View className="flex-1 relative" onLayout={onReelAreaLayout}>
        {reels.length === 0 ? (
          <View className="flex-1 justify-center items-center px-8">
            <Text className="text-white text-center mb-6">
              No reels yet. Upload your first recipe reel!
            </Text>
            <TouchableOpacity
              onPress={() => setUploadVisible(true)}
              className="bg-[#FF9800] px-6 py-3 rounded-full"
              activeOpacity={0.85}
            >
              <Text className="text-white font-semibold">Upload Recipe Reel</Text>
            </TouchableOpacity>
          </View>
        ) : reelAreaHeight > 0 ? (
          <>
            <FlatList
              ref={listRef}
              data={reels}
              extraData={activeReelId}
              keyExtractor={(item) => item.id}
              pagingEnabled
              showsVerticalScrollIndicator={false}
              bounces={false}
              removeClippedSubviews={false}
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={{ itemVisiblePercentThreshold: 80 }}
              getItemLayout={(_, index) => ({
                length: reelAreaHeight,
                offset: reelAreaHeight * index,
                index,
              })}
              renderItem={({ item }) => (
                <View style={{ height: reelAreaHeight, width: "100%" }}>
                  <ReelFeedItem reel={item} isActive={item.id === activeReelId} />
                </View>
              )}
            />

            <View
              className="absolute top-2 left-4 right-4 flex-row gap-1 z-20"
              pointerEvents="none"
            >
              {reels.map((reel, index) => (
                <View
                  key={reel.id}
                  className={`flex-1 h-1 rounded-full ${
                    index === activeIndex ? "bg-white" : "bg-white/40"
                  }`}
                />
              ))}
            </View>

            <TouchableOpacity
              onPress={() => setUploadVisible(true)}
              className="absolute top-5 right-4 w-11 h-11 rounded-full bg-[#FF9800] justify-center items-center z-30"
              activeOpacity={0.85}
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.35,
                shadowRadius: 4,
                elevation: 6,
              }}
            >
              <Ionicons name="cloud-upload-outline" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </>
        ) : null}
      </View>

      <UploadReelModal
        visible={uploadVisible}
        onClose={() => setUploadVisible(false)}
        onSubmit={handleUpload}
      />
    </View>
  );
}
