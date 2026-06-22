import ChatBlockedBanner from "@/components/chat/ChatBlockedBanner";
import ChatConfirmModal from "@/components/chat/ChatConfirmModal";
import ChatOptionsMenu from "@/components/chat/ChatOptionsMenu";
import ChatBubble from "@/components/ChatBubble";
import ChatHeader from "@/components/ChatHeader";
import { useChat } from "@/contexts/ChatContext";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type ConfirmAction = "block" | "delete" | null;

export default function ChatConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const {
    getConversation,
    isBlocked,
    isMuted,
    sendMessage,
    blockVendor,
    unblockVendor,
    toggleMute,
    deleteChat,
    markAsRead,
  } = useChat();

  const conversation = id ? getConversation(id) : undefined;
  const blocked = id ? isBlocked(id) : false;
  const muted = id ? isMuted(id) : false;

  const [draft, setDraft] = useState("");
  const [menuVisible, setMenuVisible] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

  useEffect(() => {
    if (id) {
      markAsRead(id);
    }
  }, [id, markAsRead]);

  if (!conversation || !id) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text className="text-[#9CA3AF] mb-4">Conversation not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-[#FF9800] font-medium">Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleSend = () => {
    if (!draft.trim() || blocked) return;
    sendMessage(id, draft);
    setDraft("");
  };

  const handleConfirm = () => {
    if (confirmAction === "block") {
      blockVendor(id);
    } else if (confirmAction === "delete") {
      deleteChat(id);
      router.back();
    }
    setConfirmAction(null);
  };

  const confirmConfig =
    confirmAction === "block"
      ? {
          title: "Block Vendor",
          message: `Block ${conversation.name}? You won't be able to send or receive messages from them.`,
          confirmLabel: "Block",
        }
      : confirmAction === "delete"
        ? {
            title: "Delete Chat",
            message: `Remove your conversation with ${conversation.name}? This cannot be undone.`,
            confirmLabel: "Delete",
          }
        : null;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#F9FAFB]"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <ChatHeader
        name={conversation.name}
        avatarUri={conversation.avatarUri}
        isOnline={conversation.isOnline}
        isBlocked={blocked}
        onMenuPress={() => setMenuVisible(true)}
      />

      {blocked ? <ChatBlockedBanner onUnblock={() => unblockVendor(id)} /> : null}

      <FlatList
        data={conversation.messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ChatBubble message={item} />}
        contentContainerClassName="px-4 py-4"
        showsVerticalScrollIndicator={false}
      />

      {blocked ? (
        <View className="px-4 py-4 bg-white border-t border-[#F0F0F0]">
          <Text className="text-center text-[13px] text-[#9CA3AF]">
            You cannot send messages to a blocked vendor.
          </Text>
        </View>
      ) : (
        <View className="flex-row items-center px-4 py-3 bg-white border-t border-[#F0F0F0]">
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Type a message..."
            placeholderTextColor="#9CA3AF"
            className="flex-1 bg-white border border-[#E8E8E8] rounded-full px-4 h-[44px] text-[14px] text-[#333333] mr-3"
            multiline={false}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          <TouchableOpacity
            onPress={handleSend}
            activeOpacity={0.85}
            className="w-11 h-11 rounded-full bg-[#FF9800] justify-center items-center"
          >
            <Ionicons name="send" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      <ChatOptionsMenu
        visible={menuVisible}
        isMuted={muted}
        onClose={() => setMenuVisible(false)}
        onMute={() => toggleMute(id)}
        onBlock={() => setConfirmAction("block")}
        onReport={() =>
          Alert.alert(
            "Report submitted",
            "Thank you. Our team will review this conversation."
          )
        }
        onDelete={() => setConfirmAction("delete")}
      />

      {confirmConfig ? (
        <ChatConfirmModal
          visible
          title={confirmConfig.title}
          message={confirmConfig.message}
          confirmLabel={confirmConfig.confirmLabel}
          onCancel={() => setConfirmAction(null)}
          onConfirm={handleConfirm}
        />
      ) : null}
    </KeyboardAvoidingView>
  );
}
