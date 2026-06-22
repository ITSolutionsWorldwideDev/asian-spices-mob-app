import { getReelCategories } from "@/services/reelService";
import type { UploadReelInput } from "@/types/reel";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import React, { useState } from "react";
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

export default function UploadReelModal({
  visible,
  onClose,
  onSubmit,
}: UploadReelModalProps) {
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(getReelCategories()[0]);
  const [showCategories, setShowCategories] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setVideoUri(null);
    setThumbnailUri(null);
    setTitle("");
    setDescription("");
    setCategory(getReelCategories()[0]);
    setShowCategories(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const pickVideo = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow access to your media library to upload a video.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
      allowsEditing: true,
      quality: 1,
      videoMaxDuration: 180,
    });

    if (!result.canceled && result.assets[0]) {
      setVideoUri(result.assets[0].uri);
    }
  };

  const pickThumbnail = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow access to your photos to upload a thumbnail.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setThumbnailUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!videoUri || !thumbnailUri || !title.trim() || !description.trim()) {
      Alert.alert("Missing fields", "Please fill all required fields and upload video + thumbnail.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        videoUri,
        thumbnailUri,
        title: title.trim(),
        description: description.trim(),
        category,
      });
      resetForm();
      onClose();
    } catch {
      Alert.alert("Upload failed", "Could not upload your reel. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl max-h-[92%]">
          <View className="flex-row items-center justify-between px-5 pt-5 pb-3 border-b border-[#F0F0F0]">
            <Text className="text-[18px] font-bold text-black">Upload Recipe Reel</Text>
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
              Recipe Video <Text className="text-red-500">*</Text>
            </Text>
            <TouchableOpacity
              onPress={pickVideo}
              className="border border-dashed border-[#D1D5DB] rounded-xl h-[140px] justify-center items-center bg-[#FAFAFA] mb-4"
              activeOpacity={0.8}
            >
              {videoUri ? (
                <View className="items-center">
                  <Ionicons name="checkmark-circle" size={32} color="#22C55E" />
                  <Text className="text-[#22C55E] text-sm mt-2 font-medium">Video selected</Text>
                  <Text className="text-[#9CA3AF] text-xs mt-1">Tap to change</Text>
                </View>
              ) : (
                <>
                  <Ionicons name="videocam-outline" size={32} color="#9CA3AF" />
                  <Text className="text-[#6B7280] text-sm mt-2">Click to upload video</Text>
                  <Text className="text-[#9CA3AF] text-xs mt-1">Max duration: 3 minutes</Text>
                  <Text className="text-[#9CA3AF] text-xs">MP4, MOV, AVI (Max 100MB)</Text>
                </>
              )}
            </TouchableOpacity>

            <Text className="text-sm font-semibold text-black mb-2">
              Thumbnail <Text className="text-red-500">*</Text>
            </Text>
            <TouchableOpacity
              onPress={pickThumbnail}
              className="border border-dashed border-[#D1D5DB] rounded-xl h-[100px] justify-center items-center bg-[#FAFAFA] mb-4 overflow-hidden"
              activeOpacity={0.8}
            >
              {thumbnailUri ? (
                <Image source={{ uri: thumbnailUri }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
              ) : (
                <>
                  <Ionicons name="image-outline" size={28} color="#9CA3AF" />
                  <Text className="text-[#6B7280] text-sm mt-2">Click to upload image</Text>
                  <Text className="text-[#9CA3AF] text-xs mt-1">JPG, PNG (Max 5MB)</Text>
                </>
              )}
            </TouchableOpacity>

            <Text className="text-sm font-semibold text-black mb-2">
              Recipe Title <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., Spicy Thai Basil Chicken"
              placeholderTextColor="#9CA3AF"
              className="border border-[#E5E7EB] rounded-xl px-4 h-[48px] text-[15px] text-black mb-4"
            />

            <Text className="text-sm font-semibold text-black mb-2">
              Description <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Describe your recipe..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              className="border border-[#E5E7EB] rounded-xl px-4 py-3 min-h-[100px] text-[15px] text-black mb-4"
            />

            <Text className="text-sm font-semibold text-black mb-2">
              Category <Text className="text-red-500">*</Text>
            </Text>
            <TouchableOpacity
              onPress={() => setShowCategories((prev) => !prev)}
              className="border border-[#E5E7EB] rounded-xl px-4 h-[48px] flex-row items-center justify-between mb-2"
              activeOpacity={0.8}
            >
              <Text className="text-[15px] text-black">{category}</Text>
              <Ionicons name={showCategories ? "chevron-up" : "chevron-down"} size={18} color="#9CA3AF" />
            </TouchableOpacity>

            {showCategories ? (
              <View className="border border-[#E5E7EB] rounded-xl mb-4 overflow-hidden">
                {getReelCategories().map((item) => (
                  <TouchableOpacity
                    key={item}
                    onPress={() => {
                      setCategory(item);
                      setShowCategories(false);
                    }}
                    className={`px-4 py-3 border-b border-[#F3F4F6] ${category === item ? "bg-[#FFF7ED]" : "bg-white"}`}
                  >
                    <Text className={`text-[15px] ${category === item ? "text-[#FF9800] font-semibold" : "text-black"}`}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View className="mb-4" />
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
                <Text className="text-white text-base font-semibold">Upload Reel</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
