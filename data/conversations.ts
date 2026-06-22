import { MessageItem } from "@/components/MessageListItem";

export type ChatMessage = {
  id: string;
  text: string;
  time: string;
  isOutgoing: boolean;
};

export type Conversation = MessageItem & {
  messages: ChatMessage[];
};

export const CONVERSATIONS: Record<string, Conversation> = {
  "1": {
    id: "1",
    name: "Spice Merchant Co.",
    preview: "Your order has been shipped!",
    time: "10:30 AM",
    avatarUri: "https://i.pravatar.cc/150?img=12",
    isOnline: true,
    unreadCount: 1,
    messages: [
      {
        id: "m1",
        text: "Hi! I have a question about the turmeric powder.",
        time: "10:15 AM",
        isOutgoing: true,
      },
      {
        id: "m2",
        text: "Hello! Of course, how can I help you?",
        time: "10:16 AM",
        isOutgoing: false,
      },
      {
        id: "m3",
        text: "Is it organic and gluten-free?",
        time: "10:18 AM",
        isOutgoing: true,
      },
      {
        id: "m4",
        text: "Yes! Our turmeric is 100% organic and certified gluten-free. It's sourced directly from farms in India.",
        time: "10:19 AM",
        isOutgoing: false,
      },
      {
        id: "m5",
        text: "Perfect! I'll order it now.",
        time: "10:20 AM",
        isOutgoing: true,
      },
      {
        id: "m6",
        text: "Great! Let me know if you need anything else. 😊",
        time: "10:21 AM",
        isOutgoing: false,
      },
      {
        id: "m7",
        text: "Your order has been shipped!",
        time: "10:30 AM",
        isOutgoing: false,
      },
    ],
  },
  "2": {
    id: "2",
    name: "Asian Herbs Store",
    preview: "Thank you for your purchase!",
    time: "Yesterday",
    avatarUri:
      "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=150&h=150&fit=crop",
    messages: [
      {
        id: "m1",
        text: "Thank you for your purchase!",
        time: "Yesterday",
        isOutgoing: false,
      },
    ],
  },
  "3": {
    id: "3",
    name: "Premium Spices Ltd.",
    preview: "Is there anything else I can help with?",
    time: "Jan 23",
    isOnline: true,
    messages: [
      {
        id: "m1",
        text: "Is there anything else I can help with?",
        time: "Jan 23",
        isOutgoing: false,
      },
    ],
  },
};

export const MESSAGE_LIST: MessageItem[] = Object.values(CONVERSATIONS).map(
  ({ messages, ...item }) => item
);
