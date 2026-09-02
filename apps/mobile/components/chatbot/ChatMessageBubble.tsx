import BibiLogoAvatar from "@/components/chatbot/BibiLogoAvatar";
import { API_BASE } from "@/services/api/apiBase";
import type { BibiImageResult, BibiVideoResult, ChatMessage } from "@/types/chat";
import { Image } from "expo-image";
import * as Linking from "expo-linking";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

const YOUTUBE_URL_PATTERN =
  /https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)[^\s)]+/gi;
const PRODUCT_URL_PATTERN =
  /https?:\/\/(?:www\.)?(?:asianspices\.online|asian-spices-web\.vercel\.app|asian-spices\.nl)\/spices\/[^\s)]+/gi;
const RECIPE_URL_PATTERN =
  /https?:\/\/(?:www\.)?(?:asianspices\.online|asian-spices-web\.vercel\.app|asian-spices\.nl)\/recipes\/[^\s)]+/gi;

type ChatMessageBubbleProps = {
  message: ChatMessage;
};

type PreviewCardProps = {
  url: string;
  kind: "product" | "recipe";
  youtubeUrl?: string | null;
};

function formatTimestamp(timestamp: string) {
  if (!timestamp) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function extractUrls(content: string, pattern: RegExp) {
  const matches = content.match(pattern) ?? [];
  return Array.from(
    new Set(matches.map((match) => match.replace(/[).,!?\]]+$/g, "").trim())),
  );
}

function sanitizeAssistantText(content: string) {
  return content
    .replace(YOUTUBE_URL_PATTERN, "")
    .replace(PRODUCT_URL_PATTERN, "")
    .replace(RECIPE_URL_PATTERN, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(
      /^\s*(?:link|full recipe & instructions|video tutorial|video)\s*:\s*.*$/gim,
      "",
    )
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function slugToTitle(url: string, fallback: string) {
  try {
    const slug = new URL(url).pathname.split("/").filter(Boolean).pop() ?? "";
    if (!slug) {
      return fallback;
    }

    return slug
      .split("-")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  } catch {
    return fallback;
  }
}

function PreviewCard({ url, kind, youtubeUrl = null }: PreviewCardProps) {
  const [title, setTitle] = useState(slugToTitle(url, kind === "product" ? "Product" : "Recipe"));
  const [description, setDescription] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [price, setPrice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const endpoint =
      kind === "product"
        ? `/api/product-preview?url=${encodeURIComponent(url)}`
        : `/api/recipe-preview?url=${encodeURIComponent(url)}`;

    fetch(`${API_BASE}${endpoint}`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Preview unavailable");
        }
        return response.json();
      })
      .then((data: Record<string, string | null>) => {
        if (!active) {
          return;
        }

        setTitle(data.title ?? slugToTitle(url, kind === "product" ? "Product" : "Recipe"));
        setDescription(data.description ?? null);
        setImageUrl(data.imageUrl ?? null);
        setPrice(kind === "product" ? data.base_price ?? null : null);
      })
      .catch(() => {
        if (!active) {
          return;
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [kind, url]);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => {
        void Linking.openURL(youtubeUrl ?? url);
      }}
      className="overflow-hidden rounded-[22px] border border-[#e2dacc] bg-[#f9f6f0]"
    >
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={{ width: "100%", height: 140 }} contentFit="cover" />
      ) : null}
      <View className="gap-2 p-4">
        <Text className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#98681e]">
          {kind === "product" ? "Product" : "Recipe"}
        </Text>
        <Text className="text-lg font-semibold text-[#43362f]">{title}</Text>
        {description ? (
          <Text className="text-sm leading-6 text-[#5b4d43]" numberOfLines={3}>
            {description}
          </Text>
        ) : null}
        {price ? (
          <Text className="text-sm font-semibold text-[#b45534]">{price}</Text>
        ) : null}
        {loading ? <ActivityIndicator size="small" color="#b45534" /> : null}
        <Text className="text-sm font-medium text-[#b45534]">
          {youtubeUrl ? "Watch on YouTube" : kind === "product" ? "View Product" : "View Recipe"}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function ImageResults({ images }: { images: BibiImageResult[] }) {
  return (
    <View className="gap-3">
      <Text className="px-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9a7256]">
        Product Photos
      </Text>
      {images.map((image) => (
        <View key={image.url} className="overflow-hidden rounded-[18px] border border-[#e2dacc]">
          <Image source={{ uri: image.url }} style={{ width: "100%", height: 180 }} contentFit="cover" />
          {image.alt ? (
            <Text className="px-3 py-2 text-sm text-[#7b6a5d]">{image.alt}</Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

function VideoResults({ videos }: { videos: BibiVideoResult[] }) {
  return (
    <View className="gap-3">
      <Text className="px-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9a7256]">
        Videos
      </Text>
      {videos.map((video, index) => (
        <TouchableOpacity
          key={`${video.url}-${index}`}
          activeOpacity={0.85}
          onPress={() => {
            void Linking.openURL(video.url);
          }}
          className="rounded-[18px] border border-[#e2dacc] bg-white p-4"
        >
          {video.title ? (
            <Text className="text-sm font-medium text-[#5a4d42]">{video.title}</Text>
          ) : (
            <Text className="text-sm font-medium text-[#b45534]">Open video</Text>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const isUser = message.role === "user";
  const timestampLabel = formatTimestamp(message.timestamp);
  const assistantText = isUser ? message.content : sanitizeAssistantText(message.content);
  const productUrls = isUser ? [] : extractUrls(message.content, PRODUCT_URL_PATTERN);
  const recipeUrls = isUser ? [] : extractUrls(message.content, RECIPE_URL_PATTERN);
  const youtubeUrls = isUser ? [] : extractUrls(message.content, YOUTUBE_URL_PATTERN);
  const imageResults = isUser ? [] : (message.images ?? []);
  const videoResults = isUser ? [] : (message.videos ?? []);

  return (
    <View className={`mb-4 ${isUser ? "items-end" : "items-start"}`}>
      {!isUser ? (
        <View className="mb-2 flex-row items-center gap-3">
          <BibiLogoAvatar size={40} />
          <Text className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9a7256]">
            Bibi for Asian Spices
          </Text>
        </View>
      ) : null}

      {(isUser || assistantText) && (
        <View
          className={`max-w-[92%] rounded-[22px] px-4 py-3 ${
            isUser
              ? "rounded-br-md bg-[#e8e0d6] text-[#554741]"
              : "rounded-bl-md border border-[#e9e4db] bg-white"
          }`}
        >
          <Text className={`text-[15px] leading-7 ${isUser ? "text-[#554741]" : "text-[#4f443c]"}`}>
            {isUser ? message.content : assistantText}
          </Text>
        </View>
      )}

      {!isUser && recipeUrls.length ? (
        <View className="mt-3 w-full gap-3">
          <Text className="px-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9a7256]">
            Recipes
          </Text>
          {recipeUrls.map((recipeUrl) => (
            <PreviewCard
              key={recipeUrl}
              url={recipeUrl}
              kind="recipe"
              youtubeUrl={youtubeUrls[0] ?? null}
            />
          ))}
        </View>
      ) : null}

      {!isUser && productUrls.length ? (
        <View className="mt-3 w-full gap-3">
          <Text className="px-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9a7256]">
            Products
          </Text>
          {productUrls.map((productUrl) => (
            <PreviewCard key={productUrl} url={productUrl} kind="product" />
          ))}
        </View>
      ) : null}

      {!isUser && imageResults.length ? (
        <View className="mt-3 w-full">
          <ImageResults images={imageResults} />
        </View>
      ) : null}

      {!isUser && videoResults.length ? (
        <View className="mt-3 w-full">
          <VideoResults videos={videoResults} />
        </View>
      ) : null}

      {timestampLabel || message.status === "sending" || message.status === "error" ? (
        <View className={`mt-1 flex-row gap-2 px-1 ${isUser ? "justify-end" : "justify-start"}`}>
          {timestampLabel ? <Text className="text-xs text-[#9ca3af]">{timestampLabel}</Text> : null}
          {message.status === "sending" ? (
            <Text className="text-xs text-[#9ca3af]">Sending...</Text>
          ) : null}
          {message.status === "error" ? (
            <Text className="text-xs text-[#b45534]">Failed</Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
