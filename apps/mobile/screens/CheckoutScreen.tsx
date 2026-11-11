import AppHeader from "@/components/AppHeader";
import CheckoutAddressCard from "@/components/CheckoutAddressCard";
import CheckoutAddressForm from "@/components/CheckoutAddressForm";
import CheckoutPaymentMethodCard from "@/components/CheckoutPaymentMethodCard";
import AddressFormModal from "@/components/addresses/AddressFormModal";
import { getCheckoutShippingFee, MIN_ORDER_AMOUNT_EUR, useCart } from "@/contexts/CartContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  formatAddressLine,
  formatFullAddress,
  getAddresses,
  saveAddress,
  upsertAddress,
} from "@/services/addressService";
import { showAlert } from "@/utils/alert";
import { API_BASE } from "@/services/api/apiBase";
import { getStoredAuthUser } from "@/services/api/authService";
import { apiRequest } from "@/services/api/httpClient";
import { applyPromoCode, applyRecipeDiscount, fetchRecipeDiscounts, fetchShippingOptions, getCheckoutData } from "@/services/checkoutService";
import {
  getEstimatedDelivery,
  trackRecentOrderId,
  verifyPaymentStatus,
} from "@/services/orderService";
import {
  addressToFormData,
  createEmptyAddressForm,
  type AddressFormData,
  type DeliveryAddress,
} from "@/types/address";
import type {
  AppliedPromo,
  AppliedRecipeDiscount,
  PaymentMethod,
  RecipeDiscountOption,
  ShippingOption,
} from "@/types/checkout";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
  const hasName =
    values.firstName.trim().length > 0 ||
    values.fullName.trim().length > 0;
  return (
    hasName &&
    values.street.trim().length > 0 &&
    values.city.trim().length > 0 &&
    values.zipCode.trim().length > 0
  );
}

function formatShippingEta(option: ShippingOption) {
  const min = option.minDays;
  const max = option.maxDays;
  if (typeof min === "number" && typeof max === "number") {
    if (min === max) {
      return `${min} business day${min === 1 ? "" : "s"}`;
    }
    return `${min}-${max} business days`;
  }
  if (typeof min === "number") {
    return `${min}+ business days`;
  }
  if (typeof max === "number") {
    return `Up to ${max} business days`;
  }
  return "Delivery estimate unavailable";
}

function formatRecipeDiscountLabel(
  option: RecipeDiscountOption,
  formatPrice: (value: number) => string,
) {
  const type = option.discountType.toUpperCase();
  if (type === "PERCENT" || type === "PERCENTAGE") {
    return `${option.recipeTitle} — ${option.discountValue}% off`;
  }
  return `${option.recipeTitle} — ${formatPrice(option.discountValue)} off`;
}

export default function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { formatPrice } = useCurrency();
  const { items, itemCount, subtotal, taxTotal } = useCart();

  const [loading, setLoading] = useState(true);
  const [savingAddress, setSavingAddress] = useState(false);
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState<DeliveryAddress | null>(null);
  const [showManualAddressForm, setShowManualAddressForm] = useState(false);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShippingId, setSelectedShippingId] = useState<string | null>(null);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState<AddressFormData>(
    createEmptyAddressForm("other")
  );
  const [authEmail, setAuthEmail] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [recipeDiscounts, setRecipeDiscounts] = useState<RecipeDiscountOption[]>([]);
  const [selectedRecipeDiscountId, setSelectedRecipeDiscountId] = useState<string | null>(null);
  const [appliedRecipeDiscount, setAppliedRecipeDiscount] = useState<AppliedRecipeDiscount | null>(null);
  const [recipeDiscountLoading, setRecipeDiscountLoading] = useState(false);
  const [recipeDiscountError, setRecipeDiscountError] = useState<string | null>(null);

  const placingOrderRef = useRef(false);
  const shippingRequestIdRef = useRef(0);

  const defaultAddress = useMemo(
    () => addresses.find((item) => item.isDefault) ?? addresses[0] ?? null,
    [addresses]
  );
  const selectedShippingOption = useMemo(
    () => shippingOptions.find((option) => option.id === selectedShippingId) ?? null,
    [shippingOptions, selectedShippingId]
  );
  const shippingFee = getCheckoutShippingFee(subtotal, selectedShippingOption);
  const promoDiscount = appliedPromo?.discount ?? 0;
  const recipeDiscount = appliedRecipeDiscount?.discount ?? 0;
  const discount = Math.min(subtotal, promoDiscount + recipeDiscount);
  const discountedSubtotal = Math.max(0, subtotal - discount);
  const total = discountedSubtotal + shippingFee;
  const meetsMinOrder = subtotal >= MIN_ORDER_AMOUNT_EUR;
  const minOrderRemaining = Math.max(0, MIN_ORDER_AMOUNT_EUR - subtotal);
  const minOrderMessage = `Minimum order amount is €${MIN_ORDER_AMOUNT_EUR.toFixed(2)}. Add €${minOrderRemaining.toFixed(2)} more to continue.`;

  const loadCheckout = useCallback(async () => {
    const [savedAddresses, checkoutData, authUser, availableRecipeDiscounts] = await Promise.all([
      // Guests aren't logged in, so this endpoint 401s; fall back to no saved addresses
      // instead of letting it reject the whole Promise.all (which was hiding payment methods).
      getAddresses().catch(() => []),
      getCheckoutData(),
      getStoredAuthUser().catch(() => null),
      fetchRecipeDiscounts().catch(() => []),
    ]);
    const fallbackEmail = authUser?.email?.trim() ?? "";
    setAuthEmail(fallbackEmail);
    setIsLoggedIn(Boolean(authUser));
    setRecipeDiscounts(availableRecipeDiscounts);
    setSelectedRecipeDiscountId(availableRecipeDiscounts[0]?.id ?? null);
    const preferredAddress =
      savedAddresses.find((item) => item.isDefault) ?? savedAddresses[0] ?? null;
    setAddresses(savedAddresses);
    setPaymentMethods(checkoutData.paymentMethods);
    setSelectedPaymentId(checkoutData.paymentMethods[0]?.id ?? null);
    setSelectedAddressId(preferredAddress?.id ?? null);
    const baseForm = preferredAddress
      ? addressToFormData(preferredAddress)
      : createEmptyAddressForm("other");
    // Saved addresses don't carry an email, so prefill it from the logged-in user.
    setAddressForm({ ...baseForm, email: baseForm.email || fallbackEmail });
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

  useEffect(() => {
    if (defaultAddress) {
      // Keep whatever email is already typed; backend addresses don't store one.
      setAddressForm((current) => {
        const next = addressToFormData(defaultAddress);
        return {
          ...next,
          email: next.email || current.email || authEmail,
          phone: next.phone || current.phone,
          apartment: next.apartment || defaultAddress.apartment || "",
        };
      });
    }
  }, [defaultAddress, authEmail]);

  useEffect(() => {
    const country = addressForm.country.trim();
    const city = addressForm.city.trim();

    if (!country || !city) {
      setShippingOptions([]);
      setSelectedShippingId(null);
      setShippingError(null);
      setShippingLoading(false);
      return;
    }

    setShippingLoading(true);
    setShippingError(null);
    shippingRequestIdRef.current += 1;
    const requestId = shippingRequestIdRef.current;

    const timeoutId = setTimeout(() => {
      fetchShippingOptions({
        country,
        city,
        weight: 0,
      })
        .then((options) => {
          if (shippingRequestIdRef.current !== requestId) return;
          setShippingOptions(options);
          if (options.length === 0) {
            setSelectedShippingId(null);
            setShippingError("Please enter a valid address to calculate the delivery charges.");
            return;
          }

          setSelectedShippingId((current) =>
            current && options.some((option) => option.id === current) ? current : options[0].id
          );
        })
        .catch(() => {
          if (shippingRequestIdRef.current !== requestId) return;
          setShippingOptions([]);
          setSelectedShippingId(null);
          setShippingError("Please enter a valid address to calculate the delivery charges.");
        })
        .finally(() => {
          if (shippingRequestIdRef.current === requestId) {
            setShippingLoading(false);
          }
        });
    }, 450);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [addressForm.country, addressForm.city]);

  const handleFormChange = (field: keyof AddressFormData, value: string) => {
    setAddressForm((current) => ({ ...current, [field]: value }));
  };

  const refreshAddresses = async () => {
    const savedAddresses = await getAddresses();
    setAddresses(savedAddresses);
  };

  const handleSelectSavedAddress = (address: DeliveryAddress) => {
    setSelectedAddressId(address.id);
    setAddressForm((current) => {
      const next = addressToFormData(address);
      return {
        ...next,
        email: next.email || current.email || authEmail,
        phone: next.phone || current.phone,
        apartment: next.apartment || address.apartment || "",
      };
    });
  };

  const handleOpenAddAddress = () => {
    setEditingAddress(null);
    setAddressModalVisible(true);
  };

  const handleOpenEditAddress = (address: DeliveryAddress) => {
    setEditingAddress(address);
    setAddressModalVisible(true);
  };

  const handleSaveModalAddress = async (data: AddressFormData, existingId?: string) => {
    try {
      const saved = await saveAddress(data, existingId);
      const refreshed = await getAddresses().catch(() => []);
      setAddresses(refreshed);
      setSelectedAddressId(saved.id);
      const nextForm = addressToFormData(saved);
      setAddressForm({
        ...nextForm,
        email: nextForm.email || authEmail,
        phone: nextForm.phone || data.phone,
      });
      setAddressModalVisible(false);
      showAlert(
        "Address Saved",
        existingId
          ? "Delivery address updated successfully."
          : "New delivery address added successfully."
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Could not save address.";
      showAlert("Error", msg);
    }
  };

  const persistAddress = async () => {
    if (!isFormComplete(addressForm)) {
      Alert.alert("Missing fields", "Please fill in all delivery address fields.");
      return;
    }

    setSavingAddress(true);
    try {
      const fullName =
        `${addressForm.firstName} ${addressForm.lastName}`.trim() ||
        addressForm.fullName?.trim() ||
        addressForm.firstName.trim() ||
        "Customer";
      const payload: AddressFormData = {
        ...addressForm,
        type: "other",
        fullName,
      };
      const saved = await upsertAddress(payload);
      await refreshAddresses();
      setSelectedAddressId(saved.id);
      return saved;
    } catch {
      Alert.alert("Error", "Could not save your address. Please try again.");
      return null;
    } finally {
      setSavingAddress(false);
    }
  };

  const handleSaveAddress = async () => {
    await persistAddress();
  };

  const handleApplyPromo = async () => {
    const code = promoInput.trim();
    if (!code) {
      setPromoError("Enter a promo code.");
      return;
    }

    setPromoLoading(true);
    setPromoError(null);
    try {
      const promo = await applyPromoCode(code, subtotal);
      setAppliedPromo(promo);
      setPromoInput(promo.code);
    } catch (error) {
      setAppliedPromo(null);
      setPromoError(error instanceof Error ? error.message : "Invalid promo code.");
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoInput("");
    setPromoError(null);
  };

  const handleApplyRecipeDiscount = async () => {
    if (!selectedRecipeDiscountId) {
      setRecipeDiscountError("Select a recipe discount.");
      return;
    }

    setRecipeDiscountLoading(true);
    setRecipeDiscountError(null);
    try {
      const recipe = await applyRecipeDiscount(selectedRecipeDiscountId, subtotal);
      setAppliedRecipeDiscount(recipe);
    } catch (error) {
      setAppliedRecipeDiscount(null);
      setRecipeDiscountError(
        error instanceof Error ? error.message : "Recipe discount unavailable."
      );
    } finally {
      setRecipeDiscountLoading(false);
    }
  };

  const handleRemoveRecipeDiscount = () => {
    setAppliedRecipeDiscount(null);
    setRecipeDiscountError(null);
  };

  const handlePlaceOrder = async () => {
    if (!meetsMinOrder) {
      Alert.alert("Minimum order amount", minOrderMessage);
      return;
    }

    if (!selectedShippingOption) {
      Alert.alert(
        "Delivery option required",
        "Please enter a valid address to calculate the delivery charges."
      );
      return;
    }

    if (!selectedPaymentId) {
      Alert.alert("Payment method required", "Please select a payment method to continue.");
      return;
    }

    if (placingOrder) return;

    setPlacingOrder(true);

    try {
    let savedAddress: DeliveryAddress;
    const selectedSaved = selectedAddressId
      ? addresses.find((a) => a.id === selectedAddressId)
      : null;

    const resolvedStreet = (
      addressForm.street.trim() || selectedSaved?.street?.trim() || ""
    ).trim();
    const resolvedApartment = (
      addressForm.apartment?.trim() || selectedSaved?.apartment?.trim() || ""
    ).trim();
    const resolvedCity = (
      addressForm.city.trim() || selectedSaved?.city?.trim() || ""
    ).trim();
    const resolvedState = (
      addressForm.state?.trim() || selectedSaved?.state?.trim() || ""
    ).trim();
    const resolvedZip = (
      addressForm.zipCode.trim() || selectedSaved?.zipCode?.trim() || ""
    ).trim();
    const resolvedCountry = (
      addressForm.country.trim() || selectedSaved?.country?.trim() || "NL"
    ).trim();
    const resolvedFirstName = (
      addressForm.firstName.trim() ||
      selectedSaved?.firstName?.trim() ||
      selectedSaved?.fullName?.trim() ||
      addressForm.fullName.trim() ||
      "Customer"
    ).trim();
    const resolvedLastName = (
      addressForm.lastName.trim() || selectedSaved?.lastName?.trim() || ""
    ).trim();
    const resolvedEmail = (
      addressForm.email.trim() || selectedSaved?.email?.trim() || authEmail || "customer@example.com"
    ).trim();
    const resolvedPhone = (
      addressForm.phone.trim() || selectedSaved?.phone?.trim() || ""
    ).trim();

    if (!resolvedStreet || !resolvedCity || !resolvedZip) {
      Alert.alert(
        "Missing fields",
        "Please provide your street address, city, and postal code to continue."
      );
      return;
    }

    savedAddress = {
      id: selectedSaved?.id ?? `addr-${Date.now()}`,
      type: selectedSaved?.type ?? "other",
      label: selectedSaved?.label ?? "Delivery",
      fullName: `${resolvedFirstName} ${resolvedLastName}`.trim() || resolvedFirstName,
      firstName: resolvedFirstName,
      lastName: resolvedLastName,
      email: resolvedEmail,
      phone: resolvedPhone,
      street: resolvedStreet,
      apartment: resolvedApartment,
      city: resolvedCity,
      state: resolvedState,
      zipCode: resolvedZip,
      country: resolvedCountry,
      isShippingAddress: true,
      isBillingAddress: true,
    };

    const geocodeCandidates = [
      formatFullAddress(savedAddress),
      `${savedAddress.city}, ${savedAddress.state}, ${savedAddress.country ?? ""}`,
      `${savedAddress.city}, ${savedAddress.country ?? ""}`,
      `${savedAddress.city}`,
    ]
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);

    let geocode: { lat?: number; lng?: number } | null = null;
    for (const candidate of geocodeCandidates) {
      try {
        const response = await apiRequest<{
          lat?: number;
          lng?: number;
        }>(`/api/geocode?address=${encodeURIComponent(candidate)}`);
        if (
          typeof response.lat === "number" &&
          !Number.isNaN(response.lat) &&
          typeof response.lng === "number" &&
          !Number.isNaN(response.lng)
        ) {
          geocode = response;
          break;
        }
      } catch {
        // Try next candidate.
      }
    }

    if (!geocode) {
      // Safe fallback coordinates so geocoding never blocks order placement
      geocode = { lat: 52.3676, lng: 4.9041 };
    }

    const createOrderPayload = {
      customer: {
        firstName: resolvedFirstName,
        lastName: resolvedLastName,
        email: resolvedEmail,
        phone: resolvedPhone,
      },
      shippingAddress: {
        address_line1: resolvedStreet,
        address_line2: resolvedApartment,
        city: resolvedCity,
        state: resolvedState,
        postal_code: resolvedZip,
        country: resolvedCountry,
        latitude: geocode.lat,
        longitude: geocode.lng,
      },
      cartItems: items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        base_price: item.price,
      })),
      pricing: {
        subtotal,
        discount,
        shipping: shippingFee,
        tax_amount: taxTotal,
        total,
      },
      promoCode: appliedPromo?.code,
      recipeDiscountId: appliedRecipeDiscount?.id,
      shippingMethod: selectedShippingOption.name,
    };

    const createOrderResponse = await apiRequest<{
      success?: boolean;
      orderId?: string;
      orderNumber?: string;
      error?: string;
    }>("/api/create-order", {
      method: "POST",
      body: createOrderPayload,
    });

    if (!createOrderResponse.success || !createOrderResponse.orderId) {
      throw new Error(createOrderResponse.error || "Could not create order.");
    }

    const orderId = createOrderResponse.orderId;
    console.log("[Checkout] orderId:", orderId);
    await trackRecentOrderId(orderId);

    // Works in Expo Go (exp://...) and standalone builds (asainspicesmobapp://...).
    const appReturnUrl = Linking.createURL("payment-return", {
      queryParams: {
        orderId,
        ...(selectedPaymentId ? { paymentMethod: selectedPaymentId } : {}),
      },
    });

    const successParams = new URLSearchParams({
      orderId,
      appReturnUrl,
    });
    const cancelParams = new URLSearchParams({
      orderId,
      appReturnUrl,
      status: "cancel",
    });

    // Phone-reachable API host (LAN IP), never localhost.
    const returnUrl = `${API_BASE}/checkout/success?${successParams.toString()}`;
    const cancelUrl = `${API_BASE}/checkout/cancel?${cancelParams.toString()}`;

    const paymentResponse = await apiRequest<{
      success?: boolean;
      redirectUrl?: string;
      transactionId?: string;
      error?: string;
    }>("/api/create-payment", {
      method: "POST",
      body: {
        orderId,
        amount: total,
        customerEmail: addressForm.email.trim(),
        paymentMethod: selectedPaymentId,
        returnUrl,
        cancelUrl,
        appReturnUrl,
      },
    });

    if (!paymentResponse.success || !paymentResponse.redirectUrl) {
      throw new Error(paymentResponse.error || "Could not start payment.");
    }

    placingOrderRef.current = true;

    const browserResult = await WebBrowser.openAuthSessionAsync(
      paymentResponse.redirectUrl,
      appReturnUrl,
    );

    const cancelled =
      browserResult.type === "cancel" || browserResult.type === "dismiss";

    if (cancelled) {
      Alert.alert(
        "Payment incomplete",
        "You closed the payment page before finishing. You can try again from checkout.",
      );
      return;
    }

    // Only place the order once the gateway confirms the payment succeeded.
    const paymentStatus = await verifyPaymentStatus({
      orderId,
      paymentMethod: selectedPaymentId,
      transactionId: paymentResponse.transactionId,
    });

    if (paymentStatus !== "paid") {
      Alert.alert(
        "Payment not confirmed",
        paymentStatus === "failed"
          ? "Your payment did not go through. Your order was not placed. Please try again."
          : "We couldn't confirm your payment yet. If it was charged, your order will appear in My Orders shortly.",
      );
      return;
    }

    const deliveryDate = getEstimatedDelivery();

    router.replace({
      pathname: "/order-success",
      params: {
        orderId,
        orderNumber: createOrderResponse.orderNumber ?? orderId,
        deliveryDate,
      },
    });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Checkout failed. Please try again.";
      Alert.alert("Checkout error", message);
    } finally {
      setPlacingOrder(false);
    }
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
            <View className="flex-row items-center justify-between mb-3">
              <SectionHeader icon="location-outline" title="Delivery Address" />
              <TouchableOpacity
                onPress={handleOpenAddAddress}
                activeOpacity={0.7}
                className="flex-row items-center bg-[#FFF7ED] border border-[#FF9800]/30 py-1.5 px-3 rounded-lg"
              >
                <Ionicons name="add" size={16} color="#FF9800" />
                <Text className="text-[#FF9800] text-xs font-bold ml-1">Add New</Text>
              </TouchableOpacity>
            </View>

            {addresses.length > 0 ? (
              <View className="mb-3">
                <Text className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-2">
                  Select Saved Address
                </Text>
                {addresses.map((address) => (
                  <CheckoutAddressCard
                    key={address.id}
                    address={address}
                    selected={selectedAddressId === address.id}
                    onPress={() => handleSelectSavedAddress(address)}
                    onEdit={() => handleOpenEditAddress(address)}
                  />
                ))}

                <TouchableOpacity
                  onPress={handleOpenAddAddress}
                  activeOpacity={0.8}
                  className="rounded-xl border border-dashed border-[#FF9800] bg-[#FFF7ED]/50 py-3.5 px-4 mb-3 flex-row items-center justify-center"
                >
                  <Ionicons name="add-circle-outline" size={20} color="#FF9800" />
                  <Text className="text-[14px] font-semibold text-[#FF9800] ml-2">
                    + Add New Delivery Address
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text className="text-[#6B7280] text-sm mb-4">
                Enter your delivery address details for checkout.
              </Text>
            )}

            <View className="pt-3 border-t border-[#F3F4F6]">
              <Text className="text-sm font-bold text-[#111827] mb-2">
                {addresses.length > 0 ? "Address & Contact Details" : "Delivery Details"}
              </Text>
              <CheckoutAddressForm
                values={addressForm}
                onChange={handleFormChange}
                onSave={handleSaveAddress}
                saving={savingAddress}
              />
            </View>
          </View>

          <View className="bg-white rounded-2xl p-4 mb-4">
            <SectionHeader icon="car-outline" title="Delivery" />
            {shippingLoading ? (
              <View className="py-3 flex-row items-center">
                <ActivityIndicator size="small" color="#FF9800" />
                <Text className="text-[#6B7280] text-sm ml-2">Calculating delivery charges...</Text>
              </View>
            ) : null}

            {!shippingLoading && shippingOptions.length > 0
              ? shippingOptions.map((option) => {
                  const selected = selectedShippingId === option.id;
                  return (
                    <TouchableOpacity
                      key={option.id}
                      onPress={() => setSelectedShippingId(option.id)}
                      activeOpacity={0.85}
                      className={`rounded-2xl border px-4 py-4 mb-3 flex-row items-center ${
                        selected ? "border-[#FF9800] bg-[#FFF7ED]" : "border-[#E5E7EB] bg-white"
                      }`}
                    >
                      {selected ? (
                        <Ionicons name="radio-button-on" size={20} color="#FF9800" />
                      ) : (
                        <Ionicons name="radio-button-off" size={20} color="#9CA3AF" />
                      )}
                      <View className="flex-1 ml-3">
                        <Text className="text-[18px] font-semibold text-[#1F2937]">{option.name}</Text>
                        <Text className="text-[#6B7280] text-sm mt-0.5">{formatShippingEta(option)}</Text>
                      </View>
                      <Text className="text-[26px] font-semibold text-[#111827]">
                        {formatPrice(getCheckoutShippingFee(subtotal, option))}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              : null}

            {!shippingLoading && shippingError ? (
              <Text className="text-[#EF4444] text-sm">{shippingError}</Text>
            ) : null}
          </View>

          {/* Payment Methods */}
          <View className="bg-white rounded-2xl p-4 mb-4">
            <SectionHeader icon="pricetag-outline" title="Promo Code" />
            {appliedPromo ? (
              <View className="rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] px-4 py-3 flex-row items-center justify-between">
                <View className="flex-1 mr-3">
                  <Text className="text-[15px] font-semibold text-[#166534]">
                    {appliedPromo.code} applied
                  </Text>
                  <Text className="text-[#15803D] text-sm mt-0.5">
                    You save {formatPrice(appliedPromo.discount)}
                  </Text>
                </View>
                <TouchableOpacity onPress={handleRemovePromo} hitSlop={8}>
                  <Text className="text-[#DC2626] text-sm font-semibold">Remove</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <View className="flex-row items-center">
                  <TextInput
                    value={promoInput}
                    onChangeText={(value) => {
                      setPromoInput(value);
                      if (promoError) setPromoError(null);
                    }}
                    placeholder="Enter promo code"
                    autoCapitalize="characters"
                    autoCorrect={false}
                    className="flex-1 rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-[15px] text-black"
                  />
                  <TouchableOpacity
                    onPress={handleApplyPromo}
                    disabled={promoLoading}
                    className={`ml-3 rounded-xl px-4 py-3 ${
                      promoLoading ? "bg-[#D1D5DB]" : "bg-[#FF9800]"
                    }`}
                    activeOpacity={0.85}
                  >
                    {promoLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text className="text-white text-sm font-semibold">Apply</Text>
                    )}
                  </TouchableOpacity>
                </View>
                {promoError ? (
                  <Text className="text-[#EF4444] text-sm mt-2">{promoError}</Text>
                ) : null}
              </View>
            )}
          </View>

          {recipeDiscounts.length > 0 ? (
            <View className="bg-white rounded-2xl p-4 mb-4">
              <SectionHeader icon="heart-outline" title="Recipe Discount" />
              {appliedRecipeDiscount ? (
                <View className="rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] px-4 py-3 flex-row items-center justify-between">
                  <View className="flex-1 mr-3">
                    <Text className="text-[15px] font-semibold text-[#166534]">
                      {appliedRecipeDiscount.label} applied
                    </Text>
                    <Text className="text-[#15803D] text-sm mt-0.5">
                      You save {formatPrice(appliedRecipeDiscount.discount)}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={handleRemoveRecipeDiscount} hitSlop={8}>
                    <Text className="text-[#DC2626] text-sm font-semibold">Remove</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View>
                  {recipeDiscounts.map((option) => {
                    const selected = selectedRecipeDiscountId === option.id;
                    return (
                      <TouchableOpacity
                        key={option.id}
                        onPress={() => setSelectedRecipeDiscountId(option.id)}
                        activeOpacity={0.85}
                        className={`rounded-xl border px-4 py-3 mb-3 flex-row items-center ${
                          selected ? "border-[#FF9800] bg-[#FFF7ED]" : "border-[#E5E7EB] bg-white"
                        }`}
                      >
                        {selected ? (
                          <Ionicons name="radio-button-on" size={20} color="#FF9800" />
                        ) : (
                          <Ionicons name="radio-button-off" size={20} color="#9CA3AF" />
                        )}
                        <Text className="flex-1 ml-3 text-[15px] font-medium text-[#1F2937]">
                          {formatRecipeDiscountLabel(option, formatPrice)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                  <TouchableOpacity
                    onPress={handleApplyRecipeDiscount}
                    disabled={recipeDiscountLoading}
                    className={`rounded-xl py-3 items-center ${
                      recipeDiscountLoading ? "bg-[#D1D5DB]" : "bg-[#FF9800]"
                    }`}
                    activeOpacity={0.85}
                  >
                    {recipeDiscountLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text className="text-white text-sm font-semibold">Apply</Text>
                    )}
                  </TouchableOpacity>
                  {recipeDiscountError ? (
                    <Text className="text-[#EF4444] text-sm mt-2">{recipeDiscountError}</Text>
                  ) : null}
                </View>
              )}
            </View>
          ) : null}

          <View className="bg-white rounded-2xl p-4 mb-4">
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

        <View className="mb-4">
          <View className="flex-row justify-between items-center py-1.5">
            <Text className="text-[#6B7280] text-base">Subtotal</Text>
            <Text className="text-black text-base font-medium">{formatPrice(subtotal)}</Text>
          </View>
          {discount > 0 ? (
            <View className="flex-row justify-between items-center py-1.5">
              <Text className="text-[#6B7280] text-base">Discount</Text>
              <Text className="text-[#16A34A] text-base font-medium">
                -{formatPrice(discount)}
              </Text>
            </View>
          ) : null}
          {shippingFee > 0 ? (
            <View className="flex-row justify-between items-center py-1.5">
              <Text className="text-[#6B7280] text-base">Shipping</Text>
              <Text className="text-black text-base font-medium">{formatPrice(shippingFee)}</Text>
            </View>
          ) : null}
          <View className="flex-row justify-between items-center py-1.5">
            <Text className="text-[#6B7280] text-base">Tax</Text>
            <Text className="text-black text-base font-medium">{formatPrice(taxTotal)}</Text>
          </View>
          <View className="border-t border-[#EAEAEA] mt-2 pt-3 flex-row justify-between items-center">
            <Text className="text-black text-lg font-bold">Total</Text>
            <Text className="text-[#FF9800] text-[22px] font-bold">{formatPrice(total)}</Text>
          </View>
        </View>

        {!meetsMinOrder ? (
          <View className="mb-3 rounded-xl border border-[#FDE68A] bg-[#FFFBEB] px-3 py-2.5">
            <Text className="text-[13px] leading-5 text-[#92400E]">{minOrderMessage}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          onPress={handlePlaceOrder}
          disabled={placingOrder || !meetsMinOrder}
          className={`rounded-xl py-4 items-center ${
            placingOrder || !meetsMinOrder ? "bg-[#D1D5DB]" : "bg-[#FF9800]"
          }`}
          activeOpacity={0.85}
        >
          <Text
            className={`text-base font-semibold ${
              placingOrder || !meetsMinOrder ? "text-[#6B7280]" : "text-white"
            }`}
          >
            {placingOrder ? "Processing payment..." : "Place Order"}
          </Text>
        </TouchableOpacity>
      </View>

      <AddressFormModal
        visible={addressModalVisible}
        address={editingAddress}
        onClose={() => setAddressModalVisible(false)}
        onSave={handleSaveModalAddress}
      />
    </View>
  );
}
