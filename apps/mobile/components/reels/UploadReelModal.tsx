import { getRecipeTags } from "@/services/reelService";
import type { RecipeTag, UploadReelInput } from "@/types/reel";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type UploadReelModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (input: UploadReelInput) => Promise<void>;
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function UploadReelModal({
  visible,
  onClose,
  onSubmit,
}: UploadReelModalProps) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<RecipeTag[]>([]);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) return;
    let active = true;
    setTagsLoading(true);
    getRecipeTags()
      .then((items) => {
        if (active) setTags(items);
      })
      .finally(() => {
        if (active) setTagsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [visible]);

  const resetForm = () => {
    setTitle("");
    setSlug("");
    setSlugEdited(false);
    setYoutubeUrl("");
    setThumbnailUrl("");
    setShortDescription("");
    setContent("");
    setSelectedTagIds([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!slugEdited) {
      setSlug(slugify(value));
    }
  };

  const handleSlugChange = (value: string) => {
    setSlugEdited(true);
    setSlug(slugify(value));
  };

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((current) =>
      current.includes(tagId)
        ? current.filter((id) => id !== tagId)
        : [...current, tagId]
    );
  };

  const handleSubmit = async () => {
    if (!title.trim() || !slug.trim() || !content.trim()) {
      Alert.alert(
        "Missing fields",
        "Please fill in the title, slug and recipe content."
      );
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        slug: slug.trim(),
        shortDescription: shortDescription.trim(),
        thumbnailUrl: thumbnailUrl.trim(),
        youtubeUrl: youtubeUrl.trim(),
        content: content.trim(),
        tagIds: selectedTagIds,
      });
      resetForm();
      onClose();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not upload your recipe. Please try again.";
      Alert.alert("Upload failed", message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl max-h-[92%]">
          <View className="flex-row items-center justify-between px-5 pt-5 pb-3 border-b border-[#F0F0F0]">
            <Text className="text-[18px] font-bold text-black">Upload Recipe</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={24} color="#333333" />
            </TouchableOpacity>
          </View>

          <ScrollView
            className="px-5"
            contentContainerClassName="pb-8 pt-4"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text className="text-sm font-semibold text-black mb-2">
              Recipe Title <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              value={title}
              onChangeText={handleTitleChange}
              placeholder="e.g., Spicy Thai Basil Chicken"
              placeholderTextColor="#9CA3AF"
              className="border border-[#E5E7EB] rounded-xl px-4 h-[48px] text-[15px] text-black mb-4"
            />

            <Text className="text-sm font-semibold text-black mb-2">
              Slug <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              value={slug}
              onChangeText={handleSlugChange}
              placeholder="e.g., spicy-thai-basil-chicken"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
              autoCorrect={false}
              className="border border-[#E5E7EB] rounded-xl px-4 h-[48px] text-[15px] text-black mb-4"
            />

            <Text className="text-sm font-semibold text-black mb-2">YouTube URL</Text>
            <TextInput
              value={youtubeUrl}
              onChangeText={setYoutubeUrl}
              placeholder="https://www.youtube.com/watch?v=..."
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              className="border border-[#E5E7EB] rounded-xl px-4 h-[48px] text-[15px] text-black mb-4"
            />

            <Text className="text-sm font-semibold text-black mb-2">Thumbnail URL</Text>
            <TextInput
              value={thumbnailUrl}
              onChangeText={setThumbnailUrl}
              placeholder="https://example.com/image.jpg"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              className="border border-[#E5E7EB] rounded-xl px-4 h-[48px] text-[15px] text-black mb-4"
            />

            <Text className="text-sm font-semibold text-black mb-2">Short Description</Text>
            <TextInput
              value={shortDescription}
              onChangeText={setShortDescription}
              placeholder="A short summary of your recipe..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              className="border border-[#E5E7EB] rounded-xl px-4 py-3 min-h-[80px] text-[15px] text-black mb-4"
            />

            <Text className="text-sm font-semibold text-black mb-2">
              Recipe Content <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              value={content}
              onChangeText={setContent}
              placeholder="Ingredients, steps and instructions..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              className="border border-[#E5E7EB] rounded-xl px-4 py-3 min-h-[140px] text-[15px] text-black mb-4"
            />

            <Text className="text-sm font-semibold text-black mb-2">Tags</Text>
            {tagsLoading ? (
              <View className="py-3 flex-row items-center mb-4">
                <ActivityIndicator size="small" color="#FF9800" />
                <Text className="text-[#6B7280] text-sm ml-2">Loading tags...</Text>
              </View>
            ) : tags.length > 0 ? (
              <View className="flex-row flex-wrap mb-4">
                {tags.map((tag) => {
                  const selected = selectedTagIds.includes(String(tag.id));
                  return (
                    <TouchableOpacity
                      key={tag.id}
                      onPress={() => toggleTag(String(tag.id))}
                      activeOpacity={0.8}
                      className={`px-4 py-2 rounded-full border mr-2 mb-2 ${
                        selected
                          ? "bg-[#FFF7ED] border-[#FF9800]"
                          : "bg-white border-[#E5E7EB]"
                      }`}
                    >
                      <Text
                        className={`text-sm ${
                          selected ? "text-[#FF9800] font-semibold" : "text-[#374151]"
                        }`}
                      >
                        {tag.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <Text className="text-[#9CA3AF] text-sm mb-4">No tags available.</Text>
            )}

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.85}
              className="bg-[#FF9800] h-[52px] rounded-2xl justify-center items-center"
              style={{ opacity: submitting ? 0.7 : 1 }}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white text-base font-semibold">Upload Recipe</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
