import AddPaymentMethodModal from "@/features/profile/components/payments/AddPaymentMethodModal";
import SavedPaymentCard from "@/features/profile/components/payments/SavedPaymentCard";
import AppTabBar from "@/shared/components/AppTabBar";
import {
  deletePaymentMethod,
  getSavedPaymentMethods,
  setDefaultPaymentMethod,
} from "@/features/profile/services/paymentMethodService";
import type { SavedPaymentMethod } from "@/features/profile/types/paymentMethod";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [methods, setMethods] = useState<SavedPaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  const loadMethods = useCallback(async () => {
    const saved = await getSavedPaymentMethods();
    setMethods(saved);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadMethods()
        .catch(console.error)
        .finally(() => setLoading(false));
    }, [loadMethods])
  );

  const openAddModal = () => setModalVisible(true);

  const handleDelete = (method: SavedPaymentMethod) => {
    Alert.alert(
      "Delete payment method",
      "Are you sure you want to remove this payment method?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deletePaymentMethod(method.id);
            await loadMethods();
          },
        },
      ]
    );
  };

  const handleSetDefault = async (id: string) => {
    await setDefaultPaymentMethod(id);
    await loadMethods();
  };

  return (
    <View className="flex-1 bg-[#F5F5F5]">
      <View
        className="bg-white border-b border-[#EAEAEA]"
        style={{ paddingTop: insets.top + 8, paddingBottom: 12 }}
      >
        <View className="flex-row items-center px-4">
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="w-9 h-9 justify-center items-center"
          >
            <Ionicons name="chevron-back" size={26} color="#333333" />
          </TouchableOpacity>
          <Text className="flex-1 text-center text-[18px] font-bold text-black">
            Payment Methods
          </Text>
          <TouchableOpacity
            onPress={openAddModal}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="w-9 h-9 justify-center items-center"
          >
            <Ionicons name="add" size={28} color="#FF9800" />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#FF9800" />
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-4 pt-4 pb-6"
          showsVerticalScrollIndicator={false}
        >
          {methods.map((method) => (
            <SavedPaymentCard
              key={method.id}
              method={method}
              onDelete={() => handleDelete(method)}
              onSetDefault={
                method.isDefault ? undefined : () => handleSetDefault(method.id)
              }
            />
          ))}

          <TouchableOpacity
            onPress={openAddModal}
            activeOpacity={0.85}
            className="border border-dashed border-[#D1D5DB] rounded-2xl py-8 items-center justify-center bg-white/50 mb-5"
            style={{ borderStyle: "dashed" }}
          >
            <Ionicons name="add-circle-outline" size={28} color="#9CA3AF" />
            <Text className="text-[#9CA3AF] text-[15px] font-medium mt-2">
              + Add Payment Method
            </Text>
          </TouchableOpacity>

          <View className="bg-[#EFF6FF] rounded-2xl p-4 flex-row items-start">
            <View className="w-9 h-9 rounded-full bg-[#DBEAFE] justify-center items-center mr-3">
              <Ionicons name="shield-checkmark" size={20} color="#3B82F6" />
            </View>
            <View className="flex-1">
              <Text className="text-[14px] font-bold text-[#1E40AF]">Secure & Encrypted</Text>
              <Text className="text-[#3B82F6] text-[13px] mt-1 leading-5">
                Your payment info is protected with bank-grade encryption and never shared with
                merchants.
              </Text>
            </View>
          </View>
        </ScrollView>
      )}

      <AddPaymentMethodModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSaved={loadMethods}
      />

      <AppTabBar activeTab="profile" />
    </View>
  );
}
