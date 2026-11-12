import type {
  CardFormData,
  NetBankingFormData,
  SavedPaymentMethod,
  SavedPaymentType,
  UpiFormData,
} from "@/features/profile/types/paymentMethod";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PAYMENT_METHODS_STORAGE_KEY = "@asian_spices_payment_methods";

function detectCardBrand(cardNumber: string): string {
  const digits = cardNumber.replace(/\D/g, "");
  if (digits.startsWith("4")) return "Visa";
  if (digits.startsWith("5")) return "Mastercard";
  if (digits.startsWith("3")) return "Amex";
  return "Card";
}

function sortMethods(methods: SavedPaymentMethod[]): SavedPaymentMethod[] {
  return [...methods].sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    return 0;
  });
}

/** Replace with PostgreSQL/API fetch when backend is ready. */
export async function getSavedPaymentMethods(): Promise<SavedPaymentMethod[]> {
  const stored = await AsyncStorage.getItem(PAYMENT_METHODS_STORAGE_KEY);
  if (!stored) return [];
  return sortMethods(JSON.parse(stored) as SavedPaymentMethod[]);
}

async function persist(methods: SavedPaymentMethod[]): Promise<void> {
  await AsyncStorage.setItem(
    PAYMENT_METHODS_STORAGE_KEY,
    JSON.stringify(sortMethods(methods))
  );
}

export async function addCardPayment(data: CardFormData): Promise<SavedPaymentMethod> {
  const methods = await getSavedPaymentMethods();
  const digits = data.cardNumber.replace(/\D/g, "");
  const method: SavedPaymentMethod = {
    id: `pay-${Date.now()}`,
    type: "card",
    isDefault: methods.length === 0,
    cardBrand: detectCardBrand(digits),
    last4: digits.slice(-4),
    expiry: data.expiry,
    cardholderName: data.cardholderName.trim().toUpperCase(),
  };
  methods.push(method);
  await persist(methods);
  return method;
}

export async function addUpiPayment(data: UpiFormData): Promise<SavedPaymentMethod> {
  const methods = await getSavedPaymentMethods();
  const method: SavedPaymentMethod = {
    id: `pay-${Date.now()}`,
    type: "upi",
    isDefault: methods.length === 0,
    upiId: data.upiId.trim(),
  };
  methods.push(method);
  await persist(methods);
  return method;
}

export async function addNetBankingPayment(
  data: NetBankingFormData
): Promise<SavedPaymentMethod> {
  const methods = await getSavedPaymentMethods();
  const method: SavedPaymentMethod = {
    id: `pay-${Date.now()}`,
    type: "netbanking",
    isDefault: methods.length === 0,
    bankName: data.bankName,
  };
  methods.push(method);
  await persist(methods);
  return method;
}

export async function addCashPayment(): Promise<SavedPaymentMethod> {
  const methods = await getSavedPaymentMethods();
  const existingCash = methods.find((item) => item.type === "cash");
  if (existingCash) {
    return existingCash;
  }
  const method: SavedPaymentMethod = {
    id: `pay-${Date.now()}`,
    type: "cash",
    isDefault: methods.length === 0,
  };
  methods.push(method);
  await persist(methods);
  return method;
}

export async function deletePaymentMethod(id: string): Promise<void> {
  const methods = await getSavedPaymentMethods();
  const removed = methods.find((item) => item.id === id);
  const remaining = methods.filter((item) => item.id !== id);
  if (removed?.isDefault && remaining.length > 0) {
    remaining[0] = { ...remaining[0], isDefault: true };
  }
  await persist(remaining);
}

export async function setDefaultPaymentMethod(id: string): Promise<void> {
  const methods = await getSavedPaymentMethods();
  const updated = methods.map((item) => ({
    ...item,
    isDefault: item.id === id,
  }));
  await persist(updated);
}

export function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

export function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function isValidCardForm(data: CardFormData): boolean {
  const digits = data.cardNumber.replace(/\D/g, "");
  return (
    digits.length >= 15 &&
    data.cardholderName.trim().length > 0 &&
    /^\d{2}\/\d{2}$/.test(data.expiry) &&
    data.cvv.length >= 3
  );
}

export function isValidUpiForm(data: UpiFormData): boolean {
  return /^[\w.-]+@[\w.-]+$/.test(data.upiId.trim());
}

export type { SavedPaymentType };
