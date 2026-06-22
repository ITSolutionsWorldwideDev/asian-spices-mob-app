import type { MessageItem } from "@/components/MessageListItem";
import type { ChatMessage, Conversation } from "@/data/conversations";
import { CONVERSATIONS } from "@/data/conversations";
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ChatContextValue = {
  getConversation: (id: string) => Conversation | undefined;
  getMessageList: () => MessageItem[];
  isBlocked: (id: string) => boolean;
  isMuted: (id: string) => boolean;
  sendMessage: (conversationId: string, text: string) => void;
  blockVendor: (id: string) => void;
  unblockVendor: (id: string) => void;
  toggleMute: (id: string) => void;
  deleteChat: (id: string) => void;
  markAsRead: (id: string) => void;
};

const ChatContext = createContext<ChatContextValue | null>(null);

function formatMessageTime(date = new Date()): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function toMessageItem(
  conversation: Conversation,
  isBlocked: boolean
): MessageItem {
  const { messages, ...item } = conversation;
  return { ...item, isBlocked };
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] = useState<Record<string, Conversation>>(
    () => ({ ...CONVERSATIONS })
  );
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());
  const [mutedIds, setMutedIds] = useState<Set<string>>(new Set());
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

  const getConversation = useCallback(
    (id: string) => {
      if (deletedIds.has(id)) return undefined;
      return conversations[id];
    },
    [conversations, deletedIds]
  );

  const getMessageList = useCallback((): MessageItem[] => {
    return Object.values(conversations)
      .filter((conversation) => !deletedIds.has(conversation.id))
      .map((conversation) => toMessageItem(conversation, blockedIds.has(conversation.id)));
  }, [conversations, deletedIds, blockedIds]);

  const isBlocked = useCallback((id: string) => blockedIds.has(id), [blockedIds]);

  const isMuted = useCallback((id: string) => mutedIds.has(id), [mutedIds]);

  const sendMessage = useCallback(
    (conversationId: string, text: string) => {
      if (blockedIds.has(conversationId) || deletedIds.has(conversationId)) return;

      const trimmed = text.trim();
      if (!trimmed) return;

      const time = formatMessageTime();
      const newMessage: ChatMessage = {
        id: `m-${Date.now()}`,
        text: trimmed,
        time,
        isOutgoing: true,
      };

      setConversations((prev) => {
        const conversation = prev[conversationId];
        if (!conversation) return prev;

        return {
          ...prev,
          [conversationId]: {
            ...conversation,
            preview: trimmed,
            time,
            messages: [...conversation.messages, newMessage],
          },
        };
      });
    },
    [blockedIds, deletedIds]
  );

  const blockVendor = useCallback((id: string) => {
    setBlockedIds((prev) => new Set(prev).add(id));
  }, []);

  const unblockVendor = useCallback((id: string) => {
    setBlockedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const toggleMute = useCallback((id: string) => {
    setMutedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const deleteChat = useCallback((id: string) => {
    setDeletedIds((prev) => new Set(prev).add(id));
    setBlockedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setMutedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const markAsRead = useCallback((id: string) => {
    setConversations((prev) => {
      const conversation = prev[id];
      if (!conversation?.unreadCount) return prev;

      const { unreadCount: _, ...rest } = conversation;
      return {
        ...prev,
        [id]: rest,
      };
    });
  }, []);

  const value = useMemo(
    () => ({
      getConversation,
      getMessageList,
      isBlocked,
      isMuted,
      sendMessage,
      blockVendor,
      unblockVendor,
      toggleMute,
      deleteChat,
      markAsRead,
    }),
    [
      getConversation,
      getMessageList,
      isBlocked,
      isMuted,
      sendMessage,
      blockVendor,
      unblockVendor,
      toggleMute,
      deleteChat,
      markAsRead,
    ]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within ChatProvider");
  }
  return context;
}
