import ChatInputBar from "@/components/chatbot/ChatInputBar";
import ChatMessageBubble from "@/components/chatbot/ChatMessageBubble";
import ChatQuickPrompts from "@/components/chatbot/ChatQuickPrompts";
import ChatTypingIndicator from "@/components/chatbot/ChatTypingIndicator";
import {
  BibiClientError,
  getStoredChatSessionId,
  resetStoredChatSessionId,
  sendChatMessage,
} from "@/services/bibiClient";
import type { ChatMessage } from "@/types/chat";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CHAT_HISTORY_STORAGE_KEY = "bibi-chat-history";

const initialAssistantMessage: ChatMessage = {
  id: "assistant-welcome",
  role: "assistant",
  content:
    "Hi there! I'm here to help you find the perfect spice blend or a traditional recipe. What are we cooking today?",
  timestamp: "",
  status: "sent",
};

function createMessage(
  role: ChatMessage["role"],
  content: string,
  overrides: Partial<ChatMessage> = {},
): ChatMessage {
  return {
    id: Crypto.randomUUID(),
    role,
    content: role === "assistant" ? normalizeAssistantCopy(content) : content,
    timestamp: new Date().toISOString(),
    status: "sent",
    ...overrides,
  };
}

function normalizeAssistantCopy(content: string) {
  return content
    .replace(/not currently listed in our database/gi, "not currently shown on the website")
    .replace(/currently listed in our database/gi, "currently shown on the website")
    .replace(/from our database/gi, "from the website")
    .replace(/in our database/gi, "on the website")
    .replace(/\bdatabase\b/gi, "website");
}

function sanitizeStoredMessage(value: unknown): ChatMessage | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const role =
    record.role === "user" || record.role === "assistant" || record.role === "system"
      ? record.role
      : null;
  const id = typeof record.id === "string" && record.id.trim() ? record.id : null;
  const content = typeof record.content === "string" ? record.content : null;
  const timestamp = typeof record.timestamp === "string" ? record.timestamp : "";

  if (!role || !id || content === null) {
    return null;
  }

  return {
    id,
    role,
    content: role === "assistant" ? normalizeAssistantCopy(content) : content,
    timestamp,
    csvUrl: typeof record.csvUrl === "string" ? record.csvUrl : null,
    previewTable: Array.isArray(record.previewTable)
      ? (record.previewTable as ChatMessage["previewTable"])
      : null,
    images: Array.isArray(record.images) ? (record.images as ChatMessage["images"]) : null,
    videos: Array.isArray(record.videos) ? (record.videos as ChatMessage["videos"]) : null,
    status:
      record.status === "sending" || record.status === "sent" || record.status === "error"
        ? record.status
        : "sent",
    errorMessage: typeof record.errorMessage === "string" ? record.errorMessage : null,
  };
}

async function loadStoredMessages() {
  try {
    const raw = await AsyncStorage.getItem(CHAT_HISTORY_STORAGE_KEY);
    if (!raw) {
      return [initialAssistantMessage];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.length) {
      return [initialAssistantMessage];
    }

    const messages = parsed
      .map((entry) => sanitizeStoredMessage(entry))
      .filter((entry): entry is ChatMessage => Boolean(entry));

    return messages.length ? messages : [initialAssistantMessage];
  } catch {
    return [initialAssistantMessage];
  }
}

export default function BibiChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([initialAssistantMessage]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastSubmitted, setLastSubmitted] = useState<string | null>(null);
  const [requestPhase, setRequestPhase] = useState<"idle" | "sending" | "thinking">("idle");
  const [hydrated, setHydrated] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const phaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isPending = requestPhase !== "idle";
  const showWelcomePrompts =
    messages.length === 1 && messages[0]?.role === "assistant" && messages[0]?.id === "assistant-welcome";

  useEffect(() => {
    let active = true;

    Promise.all([loadStoredMessages(), getStoredChatSessionId()])
      .then(([storedMessages, storedSessionId]) => {
        if (!active) {
          return;
        }
        setMessages(storedMessages);
        setConversationId(storedSessionId);
        setHydrated(true);
      })
      .catch(() => {
        if (active) {
          setHydrated(true);
        }
      });

    return () => {
      active = false;
      if (phaseTimerRef.current) {
        clearTimeout(phaseTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    void AsyncStorage.setItem(CHAT_HISTORY_STORAGE_KEY, JSON.stringify(messages)).catch(() => {});
  }, [hydrated, messages]);

  useEffect(() => {
    if (!messages.length) {
      return;
    }

    const timer = setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 80);

    return () => clearTimeout(timer);
  }, [messages, requestPhase]);

  const submitMessage = useCallback(
    async (messageText?: string, isRetry = false) => {
      const content = (messageText ?? input).trim();
      if (!content || isPending) {
        return;
      }

      setError(null);
      setLastSubmitted(content);

      if (!isRetry) {
        const outgoing = createMessage("user", content, { status: "sending" });
        setMessages((current) => [...current, outgoing]);
        setInput("");
      } else {
        setMessages((current) =>
          current.map((message, index) =>
            index === current.length - 1 && message.role === "user"
              ? { ...message, status: "sending", errorMessage: null }
              : message,
          ),
        );
      }

      setRequestPhase("sending");
      if (phaseTimerRef.current) {
        clearTimeout(phaseTimerRef.current);
      }
      phaseTimerRef.current = setTimeout(() => {
        setMessages((current) =>
          current.map((message) =>
            message.role === "user" && message.content === content && message.status === "sending"
              ? { ...message, status: "sent" }
              : message,
          ),
        );
        setRequestPhase((current) => (current === "sending" ? "thinking" : current));
      }, 180);

      try {
        const result = await sendChatMessage({
          message: content,
          conversationId,
        });

        setConversationId(result.conversationId);
        setMessages((current) => [
          ...current,
          createMessage("assistant", result.reply, {
            csvUrl: result.csvUrl ?? null,
            previewTable: result.previewTable ?? null,
            images: result.images ?? null,
            videos: result.videos ?? null,
          }),
        ]);
      } catch (submissionError) {
        const message =
          submissionError instanceof Error
            ? submissionError.message
            : "Unable to reach the Bibi backend.";

        if (!(submissionError instanceof BibiClientError)) {
          setError(message);
        } else {
          setError(message);
        }

        setMessages((current) =>
          current.map((entry) =>
            entry.role === "user" && entry.content === content
              ? { ...entry, status: "error", errorMessage: "Delivery failed" }
              : entry,
          ),
        );
      } finally {
        if (phaseTimerRef.current) {
          clearTimeout(phaseTimerRef.current);
          phaseTimerRef.current = null;
        }
        setRequestPhase("idle");
      }
    },
    [conversationId, input, isPending],
  );

  const handleClearChat = () => {
    Alert.alert("Clear chat", "Remove this conversation and start fresh?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: () => {
          if (phaseTimerRef.current) {
            clearTimeout(phaseTimerRef.current);
            phaseTimerRef.current = null;
          }

          void AsyncStorage.removeItem(CHAT_HISTORY_STORAGE_KEY);
          setMessages([initialAssistantMessage]);
          setInput("");
          setError(null);
          setLastSubmitted(null);
          setRequestPhase("idle");
          void resetStoredChatSessionId().then(setConversationId);
        },
      },
    ]);
  };

  const handleRetry = () => {
    if (lastSubmitted) {
      void submitMessage(lastSubmitted, true);
    }
  };

  const renderItem = ({ item }: { item: ChatMessage }) => (
    <ChatMessageBubble message={item} />
  );

  return (
    <SafeAreaView className="flex-1 bg-[#fbf8f3]" edges={["top"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <View className="flex-row items-center justify-between border-b border-[#ece6dc] bg-[#fffaf4] px-4 py-3">
          <View className="flex-row items-center">
            <Image
              source={require("@/assets/images/asian-spices-logo.png")}
              style={{ width: 120, height: 36 }}
              resizeMode="contain"
            />
          </View>
          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              onPress={handleClearChat}
              disabled={isPending}
              activeOpacity={0.85}
              className="flex-row items-center gap-1 rounded-full bg-[#fff4ea] px-3 py-2"
              style={{ opacity: isPending ? 0.6 : 1 }}
            >
              <Ionicons name="trash-outline" size={16} color="#7a5a48" />
              <Text className="text-sm font-medium text-[#7a5a48]">Clear</Text>
            </TouchableOpacity>
            {error ? (
              <TouchableOpacity
                onPress={handleRetry}
                disabled={isPending}
                activeOpacity={0.85}
                className="h-10 w-10 items-center justify-center rounded-full bg-[#fff4ea]"
                style={{ opacity: isPending ? 0.6 : 1 }}
              >
                <Ionicons name="refresh-outline" size={18} color="#7a5a48" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {error ? (
          <View className="mx-4 mt-3 rounded-[20px] border border-[#f0c7b8] bg-[#fff1eb] p-4">
            <Text className="text-sm font-semibold text-[#4f443c]">Message delivery failed</Text>
            <Text className="mt-1 text-sm leading-6 text-[#7b6a5d]">{error}</Text>
            <TouchableOpacity
              onPress={handleRetry}
              disabled={isPending}
              activeOpacity={0.85}
              className="mt-3 self-start rounded-full bg-[#b45534] px-4 py-2"
              style={{ opacity: isPending ? 0.6 : 1 }}
            >
              <Text className="text-sm font-semibold text-white">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          className="flex-1 px-4 pt-4"
          contentContainerStyle={{ paddingBottom: 16 }}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            showWelcomePrompts ? (
              <View className="items-center pb-2 pt-1">
                <View className="rounded-full bg-[#e7edf2] px-4 py-1">
                  <Text className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#818792]">
                    Today
                  </Text>
                </View>
              </View>
            ) : null
          }
          ListFooterComponent={
            <>
              {showWelcomePrompts ? (
                <ChatQuickPrompts
                  disabled={isPending}
                  onSelect={(prompt) => {
                    setInput(prompt);
                  }}
                />
              ) : null}
              {isPending ? <ChatTypingIndicator phase={requestPhase === "sending" ? "sending" : "thinking"} /> : null}
            </>
          }
        />

        <ChatInputBar
          value={input}
          isLoading={isPending}
          onChange={setInput}
          onSubmit={() => {
            void submitMessage();
          }}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
