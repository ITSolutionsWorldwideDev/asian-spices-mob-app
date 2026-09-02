import AddressCard from "@/components/addresses/AddressCard";
import AddressFormModal from "@/components/addresses/AddressFormModal";
import AppTabBar from "@/components/AppTabBar";
import {
    deleteAddress,
    getAddresses,
    saveAddress,
    setDefaultAddress,
} from "@/services/addressService";
import { ApiRequestError } from "@/services/api/httpClient";
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  const loadAddresses = useCallback(async () => {
    try {
      const savedAddresses = await getAddresses();
      setAddresses(savedAddresses);
      setErrorMessage(null);
      setIsUnauthorized(false);
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 401) {
        setAddresses([]);
        setIsUnauthorized(true);
        setErrorMessage(
          "Your account session is not authorized for addresses right now. Please login again."
        );
        return;
      }
      throw error;
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadAddresses()
        .catch((error) => {
          console.error(error);
          if (!errorMessage) {
            setErrorMessage("Could not load addresses. Please try again.");
          }
        })
        .finally(() => setLoading(false));
    }, [loadAddresses, errorMessage])
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
    try {
      await saveAddress(data, existingId);
      await loadAddresses();
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 401) {
        Alert.alert("Unauthorized", "Please login again to save addresses.");
        return;
      }
      Alert.alert("Error", "Could not save address. Please try again.");
    }
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
            try {
              await deleteAddress(address.id);
              await loadAddresses();
            } catch (error) {
              if (error instanceof ApiRequestError && error.status === 401) {
                Alert.alert("Unauthorized", "Please login again to manage addresses.");
                return;
              }
              Alert.alert("Error", "Could not delete address. Please try again.");
            }
          },
        },
      ]
    );
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultAddress(id);
      await loadAddresses();
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 401) {
        Alert.alert("Unauthorized", "Please login again to update default address.");
        return;
      }
      Alert.alert("Error", "Could not update default address. Please try again.");
    }
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
      ) : errorMessage ? (
        <View className="flex-1 justify-center items-center px-6">
          <Text className="text-[#111827] text-base font-semibold text-center">Addresses unavailable</Text>
          <Text className="text-[#6B7280] text-sm text-center mt-2">{errorMessage}</Text>
          <TouchableOpacity
            onPress={() => {
              if (isUnauthorized) {
                router.push("/signup");
                return;
              }
              setLoading(true);
              loadAddresses()
                .catch(console.error)
                .finally(() => setLoading(false));
            }}
            activeOpacity={0.85}
            className="bg-[#FF9800] h-[44px] px-5 rounded-xl justify-center items-center mt-5"
          >
            <Text className="text-white text-sm font-semibold">Retry</Text>
          </TouchableOpacity>
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
