import {
  ADDRESS_LABELS,
  type AddressFormData,
  type AddressType,
  type DeliveryAddress,
} from "@/types/address";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ADDRESSES_STORAGE_KEY = "@asian_spices_addresses";

function normalizeAddress(raw: DeliveryAddress): DeliveryAddress {
  const type: AddressType =
    raw.type ??
    (raw.label?.toLowerCase() === "office"
      ? "office"
      : raw.label?.toLowerCase() === "other"
        ? "other"
        : "home");

  return {
    ...raw,
    type,
    label: raw.label || ADDRESS_LABELS[type],
    fullName: raw.fullName ?? "",
    isDefault: raw.isDefault ?? false,
  };
}

function sortAddresses(addresses: DeliveryAddress[]): DeliveryAddress[] {
  const order: AddressType[] = ["home", "office", "other"];
  return [...addresses].sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    return order.indexOf(a.type) - order.indexOf(b.type);
  });
}

/** Replace with PostgreSQL/API fetch when backend is ready. */
export async function getAddresses(): Promise<DeliveryAddress[]> {
  const stored = await AsyncStorage.getItem(ADDRESSES_STORAGE_KEY);
  if (!stored) return [];
  const parsed = JSON.parse(stored) as DeliveryAddress[];
  return sortAddresses(parsed.map(normalizeAddress));
}

export async function getAddressByType(
  type: AddressType
): Promise<DeliveryAddress | null> {
  const addresses = await getAddresses();
  return addresses.find((item) => item.type === type) ?? null;
}

export async function saveAddresses(addresses: DeliveryAddress[]): Promise<void> {
  await AsyncStorage.setItem(
    ADDRESSES_STORAGE_KEY,
    JSON.stringify(sortAddresses(addresses))
  );
}

export async function upsertAddress(data: AddressFormData): Promise<DeliveryAddress> {
  const addresses = await getAddresses();
  const existingIndex = addresses.findIndex((item) => item.type === data.type);
  const existing = existingIndex >= 0 ? addresses[existingIndex] : null;
  const address: DeliveryAddress = {
    id: existing?.id ?? `addr-${data.type}`,
    type: data.type,
    label: ADDRESS_LABELS[data.type],
    fullName: data.fullName.trim() || existing?.fullName || "",
    street: data.street,
    city: data.city,
    state: data.state,
    zipCode: data.zipCode,
    phone: data.phone,
    isDefault: existing?.isDefault ?? addresses.length === 0,
  };

  if (existingIndex >= 0) {
    addresses[existingIndex] = address;
  } else {
    addresses.push(address);
  }

  await saveAddresses(addresses);
  return address;
}

export async function saveAddress(
  data: AddressFormData,
  existingId?: string
): Promise<DeliveryAddress> {
  const addresses = await getAddresses();
  const existingIndex = existingId
    ? addresses.findIndex((item) => item.id === existingId)
    : -1;
  const existing = existingIndex >= 0 ? addresses[existingIndex] : null;

  const address: DeliveryAddress = {
    id: existingId ?? `addr-${Date.now()}`,
    type: data.type,
    label: ADDRESS_LABELS[data.type],
    fullName: data.fullName.trim(),
    street: data.street.trim(),
    city: data.city.trim(),
    state: data.state.trim(),
    zipCode: data.zipCode.trim(),
    phone: data.phone.trim(),
    isDefault: existing?.isDefault ?? addresses.length === 0,
  };

  if (existingIndex >= 0) {
    addresses[existingIndex] = address;
  } else {
    addresses.push(address);
  }

  await saveAddresses(addresses);
  return address;
}

export async function deleteAddress(id: string): Promise<void> {
  const addresses = await getAddresses();
  const removed = addresses.find((item) => item.id === id);
  const remaining = addresses.filter((item) => item.id !== id);

  if (removed?.isDefault && remaining.length > 0) {
    remaining[0] = { ...remaining[0], isDefault: true };
  }

  await saveAddresses(remaining);
}

export async function setDefaultAddress(id: string): Promise<void> {
  const addresses = await getAddresses();
  const updated = addresses.map((item) => ({
    ...item,
    isDefault: item.id === id,
  }));
  await saveAddresses(updated);
}

export function formatFullAddress(address: DeliveryAddress): string {
  return `${address.street}, ${address.city}, ${address.state} ${address.zipCode}`;
}

export function formatAddressLine(address: DeliveryAddress): string {
  return `${address.city}, ${address.state} ${address.zipCode}`;
}
