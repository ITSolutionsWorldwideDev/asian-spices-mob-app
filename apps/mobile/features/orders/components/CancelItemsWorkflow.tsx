import type { Order, OrderLineItem } from "@/features/orders/types/order";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80";

const MIN_ORDER_AMOUNT_EUR = 10;

const CANCELLATION_REASONS = [
  "Ordered by mistake",
  "Found a better price",
  "Want to change my order",
  "Ordered the wrong product",
  "Delivery takes too long",
  "Other (please specify)",
];

export type CancelSubmitPayload = {
  reason: string;
  comments: string;
  items: { itemId: string; quantity: number }[];
};

type Props = {
  visible: boolean;
  order: Order;
  onSubmit: (payload: CancelSubmitPayload) => Promise<void>;
  onClose: () => void;
};

type Selection = Record<string, { checked: boolean; quantity: number }>;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString();
}

export default function CancelItemsWorkflow({
  visible,
  order,
  onSubmit,
  onClose,
}: Props) {
  const activeItems = useMemo(
    () =>
      order.items.filter(
        (item) =>
          item.productId &&
          item.productId !== "unknown" &&
          (item.status || "").toLowerCase() !== "cancelled"
      ),
    [order.items]
  );

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selected, setSelected] = useState<Selection>(() =>
    Object.fromEntries(
      activeItems.map((item) => [
        item.productId,
        { checked: true, quantity: item.quantity },
      ])
    )
  );
  const [reason, setReason] = useState("");
  const [comments, setComments] = useState("");
  const [validationError, setValidationError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reasonPickerOpen, setReasonPickerOpen] = useState(false);

  const isPaid = order.paymentStatus === "paid";

  const resetAndClose = () => {
    setStep(1);
    setReason("");
    setComments("");
    setValidationError("");
    setReasonPickerOpen(false);
    setSelected(
      Object.fromEntries(
        activeItems.map((item) => [
          item.productId,
          { checked: true, quantity: item.quantity },
        ])
      )
    );
    onClose();
  };

  const unitPrice = (item: OrderLineItem) => Number(item.unitPrice || 0);
  const lineTotal = (item: OrderLineItem) =>
    unitPrice(item) * Number(item.quantity || 0);

  const originalSubtotal = activeItems.reduce(
    (sum, item) => sum + lineTotal(item),
    0
  );
  const selectedEntries = activeItems
    .map((item) => ({ item, sel: selected[item.productId] }))
    .filter((e) => e.sel?.checked && e.sel.quantity > 0);

  const cancelledSubtotal = selectedEntries.reduce(
    (sum, e) => sum + unitPrice(e.item) * e.sel.quantity,
    0
  );
  const remainingSubtotal = Math.max(0, originalSubtotal - cancelledSubtotal);
  const isFullCancel =
    selectedEntries.length > 0 &&
    activeItems.every(
      (item) =>
        selected[item.productId]?.checked &&
        selected[item.productId].quantity >= item.quantity
    );
  const belowMinimum =
    !isFullCancel &&
    selectedEntries.length > 0 &&
    remainingSubtotal > 0 &&
    remainingSubtotal < MIN_ORDER_AMOUNT_EUR;

  const cancelledUnitCount = selectedEntries.reduce(
    (sum, e) => sum + e.sel.quantity,
    0
  );

  const toggleItem = (item: OrderLineItem) => {
    setSelected((prev) => ({
      ...prev,
      [item.productId]: {
        checked: !prev[item.productId]?.checked,
        quantity: prev[item.productId]?.quantity || item.quantity,
      },
    }));
  };

  const changeQuantity = (item: OrderLineItem, delta: number) => {
    const maxQty = item.quantity;
    setSelected((prev) => {
      const current = prev[item.productId]?.quantity || maxQty;
      const next = Math.max(1, Math.min(maxQty, current + delta));
      return {
        ...prev,
        [item.productId]: { checked: true, quantity: next },
      };
    });
  };

  const validateAndProceedToStep3 = () => {
    if (selectedEntries.length === 0) {
      setValidationError("Please select at least one item to cancel.");
      return;
    }
    if (belowMinimum) {
      setValidationError(
        `Cancelling these item(s) would leave a subtotal of €${remainingSubtotal.toFixed(2)}, below the €${MIN_ORDER_AMOUNT_EUR.toFixed(2)} minimum. Cancel the entire order instead, or keep enough units to stay at or above €${MIN_ORDER_AMOUNT_EUR.toFixed(2)}.`
      );
      return;
    }
    setValidationError("");
    setStep(3);
  };

  const handleFinalSubmit = async () => {
    if (!reason) {
      setValidationError("Please select a reason for cancellation.");
      return;
    }
    if (reason.startsWith("Other") && comments.trim().length < 5) {
      setValidationError(
        "Please enter a short comment to explain your cancellation."
      );
      return;
    }

    setValidationError("");
    setIsSubmitting(true);
    try {
      await onSubmit({
        reason,
        comments,
        items: selectedEntries.map((e) => ({
          itemId: e.item.productId,
          quantity: e.sel.quantity,
        })),
      });
      resetAndClose();
    } catch {
      setValidationError(
        "Something went wrong processing your request. Try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const StepDot = ({ num, label }: { num: 1 | 2 | 3; label: string }) => (
    <View className="flex-row items-center flex-1">
      <View
        className={`w-7 h-7 rounded-full items-center justify-center ${
          step >= num ? "bg-[#DC2626]" : "bg-[#F3F4F6]"
        }`}
      >
        {step > num ? (
          <Ionicons name="checkmark" size={14} color="#FFFFFF" />
        ) : (
          <Text
            className={`text-xs font-semibold ${
              step >= num ? "text-white" : "text-[#9CA3AF]"
            }`}
          >
            {num}
          </Text>
        )}
      </View>
      <Text
        className={`text-[11px] font-medium ml-1.5 ${
          step === num ? "text-black" : "text-[#9CA3AF]"
        }`}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={resetAndClose}>
      <View className="flex-1 bg-black/40 justify-end">
        <View className="bg-white rounded-t-3xl max-h-[92%] overflow-hidden">
          <View className="flex-row items-center justify-between px-4 py-4 border-b border-[#FECACA] bg-[#FEF2F2]">
            <Text className="text-base font-bold text-[#B91C1C]">
              Cancel Order Request
            </Text>
            <TouchableOpacity onPress={resetAndClose} hitSlop={8} className="flex-row items-center">
              <Ionicons name="close" size={18} color="#6B7280" />
              <Text className="text-[#6B7280] text-xs font-medium ml-1">Close</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="flex-row items-center justify-between pb-4 mb-4 border-b border-[#E5E7EB]">
              <StepDot num={1} label="Verify" />
              <StepDot num={2} label="Items" />
              <StepDot num={3} label="Reason" />
            </View>

            {validationError ? (
              <View className="bg-[#FEF2F2] rounded-xl p-3 mb-4 flex-row items-start">
                <Ionicons name="alert-circle" size={16} color="#DC2626" />
                <Text className="text-[#DC2626] text-sm font-medium ml-2 flex-1">
                  {validationError}
                </Text>
              </View>
            ) : null}

            {step === 1 ? (
              <View>
                <Text className="text-base font-bold text-black">Verify Reference Details</Text>
                <Text className="text-xs text-[#6B7280] mt-1 mb-4">
                  Please confirm this is the order you want to adjust.
                </Text>

                <View className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-4">
                  <View className="flex-row mb-3">
                    <View className="flex-1 mr-2">
                      <Text className="text-xs text-[#9CA3AF]">Order Reference</Text>
                      <Text className="font-semibold text-sm mt-0.5">
                        {order.orderNumber}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs text-[#9CA3AF]">Date Placed</Text>
                      <Text className="font-semibold text-sm mt-0.5">
                        {formatDate(order.placedAt)}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row">
                    <View className="flex-1 mr-2">
                      <Text className="text-xs text-[#9CA3AF]">Payment Status</Text>
                      <View className="self-start mt-1 bg-[#DCFCE7] rounded-full px-2 py-0.5">
                        <Text className="text-xs font-medium text-[#15803D] capitalize">
                          {order.paymentStatus}
                        </Text>
                      </View>
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs text-[#9CA3AF]">Total Charged</Text>
                      <Text className="font-semibold text-sm text-[#2563EB] mt-0.5">
                        €{order.total.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => {
                    setValidationError("");
                    setStep(2);
                  }}
                  className="bg-black rounded-xl py-3.5 items-center mt-6 flex-row justify-center"
                  activeOpacity={0.85}
                >
                  <Text className="text-white text-sm font-semibold">Confirm & Continue</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
                </TouchableOpacity>
              </View>
            ) : null}

            {step === 2 ? (
              <View>
                <Text className="text-base font-bold text-black">Select Items to Cancel</Text>
                <Text className="text-xs text-[#6B7280] mt-1 mb-4">
                  Everything is checked by default (cancels the whole order). Uncheck items
                  you want to keep, or lower the quantity to cancel only part of a line.
                </Text>

                <View className="border border-[#E5E7EB] rounded-xl overflow-hidden bg-white mb-3">
                  {activeItems.map((item, index) => {
                    const sel = selected[item.productId];
                    const isChecked = !!sel?.checked;
                    const cancelQty = sel?.quantity ?? item.quantity;
                    return (
                      <View
                        key={item.productId}
                        className={`p-3 flex-row items-center ${
                          index > 0 ? "border-t border-[#F3F4F6]" : ""
                        } ${isChecked ? "bg-[#FEF2F2]/40" : ""}`}
                      >
                        <Pressable
                          onPress={() => toggleItem(item)}
                          className={`w-5 h-5 rounded border mr-3 items-center justify-center ${
                            isChecked
                              ? "bg-[#DC2626] border-[#DC2626]"
                              : "border-[#D1D5DB] bg-white"
                          }`}
                        >
                          {isChecked ? (
                            <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                          ) : null}
                        </Pressable>

                        <Image
                          source={{ uri: item.image || PLACEHOLDER_IMAGE }}
                          style={{ width: 48, height: 48, borderRadius: 8 }}
                          contentFit="cover"
                        />

                        <View className="flex-1 ml-3">
                          <Text className="text-sm font-medium text-[#111827]" numberOfLines={2}>
                            {item.name}
                          </Text>
                          <Text className="text-xs text-[#9CA3AF] mt-0.5">
                            Purchased: {item.quantity} · €{lineTotal(item).toFixed(2)}
                          </Text>

                          {isChecked ? (
                            <View className="flex-row items-center mt-2">
                              <Text className="text-xs text-[#6B7280] font-medium mr-2">
                                Cancel qty:
                              </Text>
                              <TouchableOpacity
                                onPress={() => changeQuantity(item, -1)}
                                className="w-7 h-7 rounded-lg border border-[#E5E7EB] items-center justify-center"
                              >
                                <Text className="text-base font-bold text-[#374151]">−</Text>
                              </TouchableOpacity>
                              <Text className="mx-2 text-sm font-semibold w-6 text-center">
                                {cancelQty}
                              </Text>
                              <TouchableOpacity
                                onPress={() => changeQuantity(item, 1)}
                                className="w-7 h-7 rounded-lg border border-[#E5E7EB] items-center justify-center"
                              >
                                <Text className="text-base font-bold text-[#374151]">+</Text>
                              </TouchableOpacity>
                              <Text className="text-xs text-[#9CA3AF] ml-1">/ {item.quantity}</Text>
                            </View>
                          ) : null}
                        </View>
                      </View>
                    );
                  })}
                </View>

                <View
                  className={`rounded-xl border p-3 flex-row items-center justify-between mb-2 ${
                    belowMinimum
                      ? "bg-[#FEF2F2] border-[#FECACA]"
                      : "bg-[#F9FAFB] border-[#E5E7EB]"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      belowMinimum ? "text-[#B91C1C]" : "text-[#374151]"
                    }`}
                  >
                    Remaining order subtotal
                  </Text>
                  <Text
                    className={`text-sm font-bold ${
                      belowMinimum ? "text-[#B91C1C]" : "text-[#111827]"
                    }`}
                  >
                    €{remainingSubtotal.toFixed(2)}
                  </Text>
                </View>

                {belowMinimum ? (
                  <View className="bg-[#FEF2F2] rounded-xl p-3 mb-3 flex-row items-start">
                    <Ionicons name="alert-circle" size={16} color="#DC2626" />
                    <Text className="text-[#DC2626] text-xs font-medium ml-2 flex-1">
                      Cancelling these item(s) would leave a subtotal below the €
                      {MIN_ORDER_AMOUNT_EUR.toFixed(2)} minimum. Cancel the entire order
                      instead, or keep enough units to stay at or above €
                      {MIN_ORDER_AMOUNT_EUR.toFixed(2)}.
                    </Text>
                  </View>
                ) : null}

                <View className="flex-row justify-between items-center pt-4 border-t border-[#E5E7EB] mt-2">
                  <TouchableOpacity
                    onPress={() => {
                      setValidationError("");
                      setStep(1);
                    }}
                    className="flex-row items-center py-2"
                  >
                    <Ionicons name="arrow-back" size={16} color="#4B5563" />
                    <Text className="text-sm font-medium text-[#4B5563] ml-1">Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={validateAndProceedToStep3}
                    disabled={selectedEntries.length === 0 || belowMinimum}
                    className={`flex-row items-center bg-black rounded-xl px-4 py-2.5 ${
                      selectedEntries.length === 0 || belowMinimum ? "opacity-40" : ""
                    }`}
                    activeOpacity={0.85}
                  >
                    <Text className="text-white text-sm font-semibold">Continue</Text>
                    <Ionicons
                      name="arrow-forward"
                      size={16}
                      color="#FFFFFF"
                      style={{ marginLeft: 6 }}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}

            {step === 3 ? (
              <View>
                <View className="bg-[#FFFBEB] border border-[#FDE68A] rounded-xl p-3 mb-4 flex-row items-start">
                  <Ionicons name="alert-circle" size={16} color="#D97706" />
                  <Text className="text-[#78350F] text-xs ml-2 flex-1 leading-5">
                    <Text className="font-bold">Cancellation Policy Rule: </Text>
                    Once cancelled, this action cannot be undone.
                    {isPaid
                      ? " Since this order has been paid, the cancelled amount will be refunded to your original payment method."
                      : ""}
                  </Text>
                </View>

                <Text className="text-xs font-semibold text-[#4B5563] mb-1">
                  Reason for Cancellation <Text className="text-[#DC2626]">*</Text>
                </Text>
                <TouchableOpacity
                  onPress={() => setReasonPickerOpen((v) => !v)}
                  className="border border-[#E5E7EB] rounded-lg px-3 py-3 mb-2 bg-white flex-row justify-between items-center"
                >
                  <Text
                    className={`text-sm ${reason ? "text-[#111827]" : "text-[#9CA3AF]"}`}
                  >
                    {reason || "-- Choose Reason --"}
                  </Text>
                  <Ionicons
                    name={reasonPickerOpen ? "chevron-up" : "chevron-down"}
                    size={16}
                    color="#6B7280"
                  />
                </TouchableOpacity>

                {reasonPickerOpen ? (
                  <View className="border border-[#E5E7EB] rounded-lg mb-3 overflow-hidden">
                    {CANCELLATION_REASONS.map((r) => (
                      <TouchableOpacity
                        key={r}
                        onPress={() => {
                          setReason(r);
                          setReasonPickerOpen(false);
                          setValidationError("");
                        }}
                        className={`px-3 py-3 border-b border-[#F3F4F6] ${
                          reason === r ? "bg-[#FEF2F2]" : "bg-white"
                        }`}
                      >
                        <Text
                          className={`text-sm ${
                            reason === r ? "text-[#B91C1C] font-semibold" : "text-[#374151]"
                          }`}
                        >
                          {r}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : null}

                <Text className="text-xs font-semibold text-[#4B5563] mb-1 mt-2">
                  Comments {reason.startsWith("Other") ? "" : "(Optional)"}
                </Text>
                <TextInput
                  value={comments}
                  onChangeText={setComments}
                  placeholder={
                    reason.startsWith("Other")
                      ? "Please specify your reason here..."
                      : "Add optional notes..."
                  }
                  placeholderTextColor="#9CA3AF"
                  multiline
                  className="border border-[#E5E7EB] rounded-lg p-3 text-sm text-[#111827] min-h-[80px] bg-white"
                  textAlignVertical="top"
                />

                <View className="flex-row justify-between items-center pt-4 border-t border-[#E5E7EB] mt-4">
                  <TouchableOpacity
                    onPress={() => {
                      setValidationError("");
                      setStep(2);
                    }}
                    disabled={isSubmitting}
                    className="flex-row items-center py-2"
                  >
                    <Ionicons name="arrow-back" size={16} color="#4B5563" />
                    <Text className="text-sm font-medium text-[#4B5563] ml-1">Back</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleFinalSubmit}
                    disabled={isSubmitting}
                    className="bg-[#DC2626] rounded-xl px-5 py-2.5 flex-row items-center"
                    activeOpacity={0.85}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text className="text-white text-sm font-semibold">
                        {isFullCancel
                          ? "Confirm Cancellation"
                          : `Cancel ${cancelledUnitCount} Unit(s)`}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
