import { verifyPaymentStatus } from "@/services/orderService";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, Alert, View } from "react-native";

export default function PaymentReturnRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    orderId?: string;
    status?: string;
    orderNumber?: string;
    paymentMethod?: string;
    transactionId?: string;
  }>();

  useEffect(() => {
    let active = true;

    const handleReturn = async () => {
      const status = String(params.status ?? "").toLowerCase();
      const orderId = params.orderId ? String(params.orderId) : null;

      if (status === "cancel") {
        router.replace("/checkout");
        return;
      }

      if (!orderId) {
        router.replace("/(tabs)");
        return;
      }

      // Confirm the payment actually succeeded before showing order success.
      const paymentStatus = await verifyPaymentStatus({
        orderId,
        paymentMethod: params.paymentMethod ? String(params.paymentMethod) : null,
        transactionId: params.transactionId ? String(params.transactionId) : null,
      });

      if (!active) return;

      if (paymentStatus !== "paid") {
        Alert.alert(
          "Payment not confirmed",
          paymentStatus === "failed"
            ? "Your payment did not go through. Your order was not placed. Please try again."
            : "We couldn't confirm your payment yet. If it was charged, your order will appear in My Orders shortly.",
        );
        router.replace("/checkout");
        return;
      }

      router.replace({
        pathname: "/order-success",
        params: {
          orderId,
          orderNumber: params.orderNumber ? String(params.orderNumber) : orderId,
        },
      });
    };

    handleReturn();

    return () => {
      active = false;
    };
  }, [
    params.orderId,
    params.orderNumber,
    params.paymentMethod,
    params.status,
    params.transactionId,
    router,
  ]);

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator size="large" color="#FF9800" />
    </View>
  );
}
