import AddressCard from "@/components/addresses/AddressCard";
import AddressFormModal from "@/components/addresses/AddressFormModal";
import AppTabBar from "@/components/AppTabBar";
import {
  deleteAddress,
  getAddresses,
  saveAddress,
  setDefaultAddress,
} from "@/services/addressService";
import { getUserProfile } from "@/services/profileService";
import type { AddressFormData, DeliveryAddress } from "@/types/address";
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

export default function MyAddressesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState<DeliveryAddress | null>(null);
  const [defaultFullName, setDefaultFullName] = useState("");

  const loadAddresses = useCallback(async () => {
    const [savedAddresses, profile] = await Promise.all([
      getAddresses(),
      getUserProfile(),
    ]);
    setAddresses(savedAddresses);
    setDefaultFullName(profile.name);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadAddresses()
        .catch(console.error)
        .finally(() => setLoading(false));
    }, [loadAddresses])
  );

  const openAddModal = () => {
    setEditingAddress(null);
    setModalVisible(true);
  };

  const openEditModal = (address: DeliveryAddress) => {
    setEditingAddress(address);
    setModalVisible(true);
  };

  const handleSave = async (data: AddressFormData, existingId?: string) => {
    await saveAddress(data, existingId);
    await loadAddresses();
  };

  const handleDelete = (address: DeliveryAddress) => {
    Alert.alert(
      "Delete address",
      `Remove ${address.label} address?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteAddress(address.id);
            await loadAddresses();
          },
        },
      ]
    );
  };

  const handleSetDefault = async (id: string) => {
    await setDefaultAddress(id);
    await loadAddresses();
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
            My Addresses
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
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              onEdit={() => openEditModal(address)}
              onDelete={() => handleDelete(address)}
              onSetDefault={
                address.isDefault ? undefined : () => handleSetDefault(address.id)
              }
            />
          ))}

          <TouchableOpacity
            onPress={openAddModal}
            activeOpacity={0.85}
            className="border border-dashed border-[#D1D5DB] rounded-2xl py-8 items-center justify-center bg-white/50"
            style={{ borderStyle: "dashed" }}
          >
            <Ionicons name="add-circle-outline" size={28} color="#9CA3AF" />
            <Text className="text-[#9CA3AF] text-[15px] font-medium mt-2">
              + Add New Address
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      <AddressFormModal
        visible={modalVisible}
        address={editingAddress}
        defaultFullName={defaultFullName}
        onClose={() => {
          setModalVisible(false);
          setEditingAddress(null);
        }}
        onSave={handleSave}
      />

      <AppTabBar activeTab="profile" />
    </View>
  );
}
