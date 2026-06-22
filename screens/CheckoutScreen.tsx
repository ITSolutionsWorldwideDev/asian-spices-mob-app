import AppHeader from "@/components/AppHeader";
import CheckoutAddressCard from "@/components/CheckoutAddressCard";
import CheckoutAddressForm from "@/components/CheckoutAddressForm";
import CheckoutPaymentMethodCard from "@/components/CheckoutPaymentMethodCard";
import { getCartTotal, getShippingFee, useCart } from "@/contexts/CartContext";
import { getAddresses, upsertAddress, formatFullAddress } from "@/services/addressService";
import { getCheckoutData } from "@/services/checkoutService";
import { createOrderFromCart, getEstimatedDelivery } from "@/services/orderService";
import {
    addressToFormData,
    createEmptyAddressForm,
    type AddressFormData,
    type AddressType,
    type DeliveryAddress,
} from "@/types/address";
import type { PaymentMethod } from "@/types/checkout";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ADDRESS_TYPES: AddressType[] = ["home", "office"];

function SectionHeader({
  icon,
  title,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
}) {
  return (
    <View className="flex-row items-center mb-3">
      <Ionicons name={icon} size={20} color="#FF9800" />
      <Text className="text-base font-bold text-black ml-2">{title}</Text>
    </View>
  );
}

function isFormComplete(values: AddressFormData): boolean {
  return (
    values.street.trim().length > 0 &&
    values.city.trim().length > 0 &&
    values.state.trim().length > 0 &&
    values.zipCode.trim().length > 0 &&
    values.phone.trim().length > 0
  );
}

export default function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { items, itemCount, subtotal } = useCart();

  const [loading, setLoading] = useState(true);
  const [savingType, setSavingType] = useState<AddressType | null>(null);
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedAddressType, setSelectedAddressType] = useState<AddressType>("home");
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [editingType, setEditingType] = useState<AddressType | null>(null);
  const [homeForm, setHomeForm] = useState<AddressFormData>(createEmptyAddressForm("home"));
  const [officeForm, setOfficeForm] = useState<AddressFormData>(createEmptyAddressForm("office"));

  const placingOrderRef = useRef(false);

  const shipping = getShippingFee(subtotal);
  const total = getCartTotal(subtotal);

  const homeAddress = useMemo(
    () => addresses.find((item) => item.type === "home") ?? null,
    [addresses]
  );
  const officeAddress = useMemo(
    () => addresses.find((item) => item.type === "office") ?? null,
    [addresses]
  );

  const loadCheckout = useCallback(async () => {
    const [savedAddresses, checkoutData] = await Promise.all([
      getAddresses(),
      getCheckoutData(),
    ]);
    setAddresses(savedAddresses);
    setPaymentMethods(checkoutData.paymentMethods);
    setSelectedPaymentId(checkoutData.paymentMethods[0]?.id ?? null);

    const home = savedAddresses.find((item) => item.type === "home");
    const office = savedAddresses.find((item) => item.type === "office");
    setSelectedAddressType(home ? "home" : office ? "office" : "home");
    setHomeForm(home ? addressToFormData(home) : createEmptyAddressForm("home"));
    setOfficeForm(office ? addressToFormData(office) : createEmptyAddressForm("office"));
    setEditingType(null);
  }, []);

  useEffect(() => {
    if (items.length === 0 && !placingOrderRef.current) {
      router.replace("/cart");
      return;
    }
    loadCheckout()
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [items.length, loadCheckout, router]);

  const getFormForType = (type: AddressType) => (type === "home" ? homeForm : officeForm);

  const handleFormChange = (type: AddressType, field: keyof AddressFormData, value: string) => {
    const setter = type === "home" ? setHomeForm : setOfficeForm;
    setter((current) => ({ ...current, [field]: value }));
  };

  const refreshAddresses = async (preferredType?: AddressType) => {
    const savedAddresses = await getAddresses();
    setAddresses(savedAddresses);

    const home = savedAddresses.find((item) => item.type === "home");
    const office = savedAddresses.find((item) => item.type === "office");

    if (preferredType) {
      setSelectedAddressType(preferredType);
    } else if (home) {
      setSelectedAddressType("home");
    } else if (office) {
      setSelectedAddressType("office");
    }

    if (home) setHomeForm(addressToFormData(home));
    if (office) setOfficeForm(addressToFormData(office));
  };

  const handleSaveAddress = async (type: AddressType) => {
    const formValues = getFormForType(type);

    if (!isFormComplete(formValues)) {
      Alert.alert("Missing fields", `Please fill in all ${type} address fields.`);
      return;
    }

    setSavingType(type);
    try {
      await upsertAddress(formValues);
      await refreshAddresses(type);
      setEditingType(null);
    } catch {
      Alert.alert("Error", "Could not save your address. Please try again.");
    } finally {
      setSavingType(null);
    }
  };

  const handleEditAddress = (type: AddressType) => {
    const address = type === "home" ? homeAddress : officeAddress;
    if (address) {
      const formData = addressToFormData(address);
      if (type === "home") setHomeForm(formData);
      else setOfficeForm(formData);
    }
    setEditingType(type);
  };

  const savePendingForms = async (): Promise<AddressType | null> => {
    const pendingTypes = ADDRESS_TYPES.filter((type) => {
      const saved = type === "home" ? homeAddress : officeAddress;
      const isEditing = editingType === type;
      const form = getFormForType(type);
      return (!saved || isEditing) && isFormComplete(form);
    });

    for (const type of pendingTypes) {
      await upsertAddress(getFormForType(type));
    }

    if (pendingTypes.length > 0) {
      await refreshAddresses(pendingTypes[pendingTypes.length - 1]);
      setEditingType(null);
    }

    const updated = await getAddresses();
    const selected = updated.find((item) => item.type === selectedAddressType);
    if (selected) return selected.type;

    return updated[0]?.type ?? null;
  };

  const handlePlaceOrder = async () => {
    const savedType = await savePendingForms();
    const updatedAddresses = await getAddresses();

    if (updatedAddresses.length === 0) {
      Alert.alert(
        "Missing address",
        "Please add at least one delivery address (Home or Office) before placing your order."
      );
      return;
    }

    const deliveryType = savedType ?? selectedAddressType;
    const deliveryAddress = updatedAddresses.find((item) => item.type === deliveryType);
    if (!deliveryAddress) {
      Alert.alert("Missing address", "Please select a delivery address.");
      return;
    }

    const deliveryDate = getEstimatedDelivery();
    const order = await createOrderFromCart(
      items,
      total,
      deliveryDate,
      formatFullAddress(deliveryAddress)
    );
    placingOrderRef.current = true;

    router.replace({
      pathname: "/order-success",
      params: {
        orderNumber: order.orderNumber,
        deliveryDate,
        orderId: order.id,
      },
    });
  };

  const renderAddressSlot = (type: AddressType) => {
    const address = type === "home" ? homeAddress : officeAddress;
    const isEditing = editingType === type;
    const showForm = !address || isEditing;

    if (showForm) {
      return (
        <CheckoutAddressForm
          key={`form-${type}`}
          type={type}
          values={getFormForType(type)}
          onChange={(field, value) => handleFormChange(type, field, value)}
          onSave={() => handleSaveAddress(type)}
          saving={savingType === type}
        />
      );
    }

    return (
      <CheckoutAddressCard
        key={`card-${type}`}
        address={address}
        selected={selectedAddressType === type}
        onPress={() => setSelectedAddressType(type)}
        onEdit={() => handleEditAddress(type)}
      />
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-[#F5F5F5] justify-center items-center">
        <ActivityIndicator size="large" color="#FF9800" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#F5F5F5]">
      <AppHeader searchPlaceholder="Search spices, recipes..." />

      <View className="bg-white border-b border-[#EAEAEA] py-3">
        <View className="flex-row items-center px-4">
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="w-9 h-9 justify-center items-center"
          >
            <Ionicons name="chevron-back" size={26} color="#333333" />
          </TouchableOpacity>
          <Text className="flex-1 text-center text-[18px] font-bold text-black mr-9">
            Checkout
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="bg-white rounded-2xl p-4 mb-4">
            <SectionHeader icon="location-outline" title="Delivery Address" />
            <Text className="text-[#6B7280] text-sm mb-4">
              Choose Home or Office address for delivery.
            </Text>
            {ADDRESS_TYPES.map((type) => renderAddressSlot(type))}
          </View>

          <View className="bg-white rounded-2xl p-4">
            <SectionHeader icon="card-outline" title="Payment Method" />
            {paymentMethods.map((method) => (
              <CheckoutPaymentMethodCard
                key={method.id}
                method={method}
                selected={selectedPaymentId === method.id}
                onPress={() => setSelectedPaymentId(method.id)}
              />
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View
        className="bg-white border-t border-[#EAEAEA] px-4 pt-4"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        <View className="flex-row items-center mb-3">
          <Ionicons name="cube-outline" size={20} color="#FF9800" />
          <Text className="text-base font-bold text-black ml-2">
            Order Items ({itemCount})
          </Text>
        </View>

        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-[#6B7280] text-base">Total Amount</Text>
          <Text className="text-[#FF9800] text-[22px] font-bold">
            ${total.toFixed(2)}
          </Text>
        </View>

        <TouchableOpacity
          onPress={handlePlaceOrder}
          className="bg-[#FF9800] rounded-xl py-4 items-center"
          activeOpacity={0.85}
        >
          <Text className="text-white text-base font-semibold">Place Order</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
