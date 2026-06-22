import ChatListHeader from "@/components/chat/ChatListHeader";
import MessageListItem from "@/components/MessageListItem";
import { useChat } from "@/contexts/ChatContext";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { FlatList, Text, View } from "react-native";

export default function MessagesScreen() {
  const router = useRouter();
  const { getMessageList } = useChat();
  const [searchQuery, setSearchQuery] = useState("");

  const messageList = getMessageList();

  const filteredList = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return messageList;

    return messageList.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.preview.toLowerCase().includes(query)
    );
  }, [messageList, searchQuery]);

  return (
    <View className="flex-1 bg-[#F5F5F5]">
      <ChatListHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <Text className="text-center text-lg font-bold text-black py-4 bg-[#F5F5F5]">
        Messages
      </Text>

      <FlatList
        data={filteredList}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <MessageListItem
            item={item}
            showDivider={index < filteredList.length - 1}
            onPress={() =>
              router.push({
                pathname: "/(tabs)/chat/[id]",
                params: { id: item.id },
              })
            }
          />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-4"
        ListEmptyComponent={
          <View className="py-16 items-center">
            <Text className="text-[#9CA3AF] text-[14px]">
              {searchQuery.trim() ? "No conversations found" : "No messages yet"}
            </Text>
          </View>
        }
      />
    </View>
  );
}
