export type SavedPaymentType = "card" | "upi" | "netbanking" | "cash";

export type SavedPaymentMethod = {
  id: string;
  type: SavedPaymentType;
  isDefault: boolean;
  cardBrand?: string;
  last4?: string;
  expiry?: string;
  cardholderName?: string;
  upiId?: string;
  bankName?: string;
};

export type CardFormData = {
  cardNumber: string;
  cardholderName: string;
  expiry: string;
  cvv: string;
};

export type UpiFormData = {
  upiId: string;
};

export type NetBankingFormData = {
  bankName: string;
};

export function createEmptyCardForm(): CardFormData {
  return {
    cardNumber: "",
    cardholderName: "",
    expiry: "",
    cvv: "",
  };
}

export function getPaymentTypeLabel(type: SavedPaymentType): string {
  switch (type) {
    case "card":
      return "Card";
    case "upi":
      return "UPI";
    case "netbanking":
      return "Net Banking";
    case "cash":
      return "Cash on Delivery";
  }
}

export function getPaymentDisplayTitle(method: SavedPaymentMethod): string {
  switch (method.type) {
    case "card":
      return `${method.cardBrand ?? "Card"} **** ${method.last4 ?? "****"}`;
    case "upi":
      return method.upiId ?? "UPI";
    case "netbanking":
      return method.bankName ?? "Net Banking";
    case "cash":
      return "Cash on Delivery";
  }
}
