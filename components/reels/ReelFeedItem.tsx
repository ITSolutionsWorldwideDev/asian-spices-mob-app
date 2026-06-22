import type { ReelItem } from "@/types/reel";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

type ReelFeedItemProps = {
  reel: ReelItem;
  isActive: boolean;
};

function formatCount(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  }
  return String(value);
}

function ReelOverlay({
  reel,
  liked,
  likeCount,
  muted,
  onToggleLike,
  onToggleMute,
}: {
  reel: ReelItem;
  liked: boolean;
  likeCount: number;
  muted: boolean;
  onToggleLike: () => void;
  onToggleMute: () => void;
}) {
  return (
    <>
      <LinearGradient
        colors={["rgba(0,0,0,0.45)", "transparent", "rgba(0,0,0,0.8)"]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        pointerEvents="none"
      />

      <View className="absolute right-3 bottom-4 items-center gap-4 z-10">
        <View className="items-center">
          <View className="relative">
            <Image
              source={{ uri: reel.userAvatar }}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                borderWidth: 2,
                borderColor: "#FFFFFF",
              }}
            />
            <View className="absolute -bottom-1 self-center w-5 h-5 rounded-full bg-[#FF9800] justify-center items-center">
              <Ionicons name="add" size={14} color="#FFFFFF" />
            </View>
          </View>
        </View>

        <TouchableOpacity onPress={onToggleLike} className="items-center">
          <Ionicons
            name={liked ? "heart" : "heart-outline"}
            size={30}
            color={liked ? "#FF9800" : "#FFFFFF"}
          />
          <Text className="text-white text-xs mt-1">{formatCount(likeCount)}</Text>
        </TouchableOpacity>

        <TouchableOpacity className="items-center">
          <Ionicons name="chatbubble-ellipses-outline" size={28} color="#FFFFFF" />
          <Text className="text-white text-xs mt-1">{reel.comments}</Text>
        </TouchableOpacity>

        <TouchableOpacity className="items-center">
          <Ionicons name="share-social-outline" size={28} color="#FFFFFF" />
          <Text className="text-white text-xs mt-1">Share</Text>
        </TouchableOpacity>

        <View className="relative items-center">
          <View className="w-11 h-11 rounded-full bg-[#FF9800] justify-center items-center">
            <Ionicons name="bag-handle-outline" size={22} color="#FFFFFF" />
          </View>
          {reel.shopCount ? (
            <View className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 justify-center items-center px-1">
              <Text className="text-white text-[10px] font-bold">{reel.shopCount}</Text>
            </View>
          ) : null}
        </View>

        <TouchableOpacity onPress={onToggleMute} className="items-center">
          <Ionicons
            name={muted ? "volume-mute" : "volume-high"}
            size={26}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>

      <View className="absolute left-4 right-20 bottom-4 z-10">
        <Text className="text-white text-[15px] font-bold mb-1">{reel.username}</Text>
        <Text className="text-white text-[14px] leading-5 mb-2" numberOfLines={3}>
          {reel.description}
        </Text>
        <View className="flex-row items-center gap-4">
          <View className="flex-row items-center">
            <Ionicons name="eye-outline" size={14} color="#FFFFFF" />
            <Text className="text-white text-xs ml-1">{reel.views} views</Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="time-outline" size={14} color="#FFFFFF" />
            <Text className="text-white text-xs ml-1">{reel.duration}</Text>
          </View>
        </View>
      </View>
    </>
  );
}

function ReelFeedItemPlayer({ reel }: { reel: ReelItem }) {
  const [liked, setLiked] = useState(false);
  const [muted, setMuted] = useState(false);
  const [likeCount, setLikeCount] = useState(reel.likes);

  const player = useVideoPlayer(reel.videoUri, (instance) => {
    instance.loop = true;
    instance.muted = false;
    instance.play();
  });

  useEffect(() => {
    player.muted = muted;
  }, [muted, player]);

  useEffect(() => {
    let mounted = true;

    const safePlay = () => {
      if (!mounted) return;
      try {
        player.play();
      } catch {
        // Native player may already be released during unmount.
      }
    };

    safePlay();

    const retryTimers = [150, 400, 800].map((delay) => setTimeout(safePlay, delay));

    const subscription = player.addListener("statusChange", (payload) => {
      if (payload.status === "readyToPlay") {
        safePlay();
      }
    });

    return () => {
      mounted = false;
      retryTimers.forEach(clearTimeout);
      subscription.remove();
    };
  }, [player, reel.videoUri]);

  const toggleLike = () => {
    setLiked((prev) => !prev);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
  };

  return (
    <View className="flex-1 w-full bg-black">
      <VideoView
        player={player}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        contentFit="cover"
        nativeControls={false}
        allowsFullscreen={false}
        allowsPictureInPicture={false}
      />
      <ReelOverlay
        reel={reel}
        liked={liked}
        likeCount={likeCount}
        muted={muted}
        onToggleLike={toggleLike}
        onToggleMute={() => setMuted((prev) => !prev)}
      />
    </View>
  );
}

function ReelFeedItemPlaceholder({ reel }: { reel: ReelItem }) {
  const [liked, setLiked] = useState(false);
  const [muted, setMuted] = useState(false);
  const [likeCount, setLikeCount] = useState(reel.likes);

  const toggleLike = () => {
    setLiked((prev) => !prev);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
  };

  return (
    <View className="flex-1 w-full bg-black">
      <Image
        source={{ uri: reel.thumbnailUri }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        contentFit="cover"
      />
      <View className="absolute inset-0 justify-center items-center">
        <View className="w-14 h-14 rounded-full bg-black/40 justify-center items-center">
          <Ionicons name="play" size={28} color="#FFFFFF" />
        </View>
      </View>
      <ReelOverlay
        reel={reel}
        liked={liked}
        likeCount={likeCount}
        muted={muted}
        onToggleLike={toggleLike}
        onToggleMute={() => setMuted((prev) => !prev)}
      />
    </View>
  );
}

export default function ReelFeedItem({ reel, isActive }: ReelFeedItemProps) {
  if (!isActive) {
    return <ReelFeedItemPlaceholder reel={reel} />;
  }

  return <ReelFeedItemPlayer key={reel.id} reel={reel} />;
}
