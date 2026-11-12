import { refreshNextAuthSession } from "@/shared/services/api/authService";
import { ApiRequestError, apiRequest } from "@/shared/services/api/httpClient";
import {
    ADDRESS_LABELS,
    type AddressFormData,
    type AddressType,
    type DeliveryAddress,
} from "@/features/profile/types/address";

function buildFullName(data: AddressFormData, fallback = "") {
  const name = `${data.firstName ?? ""} ${data.lastName ?? ""}`.trim();
  if (name.length > 0) return name;
  if ((data.fullName ?? "").trim().length > 0) return data.fullName.trim();
  return fallback.trim();
}

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
    firstName: raw.firstName ?? "",
    lastName: raw.lastName ?? "",
    email: raw.email ?? "",
    country: raw.country ?? "",
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

type BackendAddress = {
  id: string | number;
  label?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
  is_default?: boolean | null;
  is_shipping_address?: boolean | null;
  is_billing_address?: boolean | null;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
};

type BackendAddressesResponse = {
  success?: boolean;
  addresses?: BackendAddress[];
};

type BackendAddressWriteResponse = {
  success?: boolean;
  address?: BackendAddress;
};

export type CountryOption = {
  id: string;
  name: string;
  iso2?: string;
  currency_code?: string;
  is_shippable?: boolean;
};

async function apiRequestWithSessionRetry<T>(
  path: string,
  options?: Omit<RequestInit, "body"> & { body?: unknown },
): Promise<T> {
  try {
    return await apiRequest<T>(path, options);
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 401) {
      const refreshed = await refreshNextAuthSession();
      if (refreshed) {
        return apiRequest<T>(path, options);
      }
    }
    throw error;
  }
}

function mapBackendAddress(row: BackendAddress): DeliveryAddress {
  const firstName = row.first_name?.trim() ?? "";
  const lastName = row.last_name?.trim() ?? "";
  const fullName = `${firstName} ${lastName}`.trim();

  return normalizeAddress({
    id: String(row.id),
    type: "other",
    label: row.label?.trim() || "Other",
    fullName,
    firstName,
    lastName,
    email: "",
    country: row.country?.trim() || "",
    street: row.address_line1?.trim() || "",
    apartment: row.address_line2?.trim() || "",
    city: row.city?.trim() || "",
    state: row.state?.trim() || "",
    zipCode: row.postal_code?.trim() || "",
    phone: row.phone?.trim() || "",
    isShippingAddress: row.is_shipping_address ?? true,
    isBillingAddress: row.is_billing_address ?? true,
    isDefault: Boolean(row.is_default),
  });
}

function toBackendPayload(data: AddressFormData) {
  return {
    label: ADDRESS_LABELS[data.type],
    address_line1: data.street.trim(),
    address_line2: data.apartment.trim(),
    city: data.city.trim(),
    state: data.state.trim(),
    postal_code: data.zipCode.trim(),
    country: data.country.trim(),
    is_shipping_address: Boolean(data.isShippingAddress),
    is_billing_address: Boolean(data.isBillingAddress),
  };
}

export async function getShippableCountries(): Promise<CountryOption[]> {
  const rows = await apiRequestWithSessionRetry<CountryOption[]>("/api/countries?shippable=true");
  return rows
    .filter((row) => Boolean(row?.name))
    .map((row) => ({
      ...row,
      id: String(row.id ?? row.iso2 ?? row.name),
      name: row.name.trim(),
    }));
}

export async function getAddresses(): Promise<DeliveryAddress[]> {
  const response = await apiRequestWithSessionRetry<BackendAddressesResponse>("/api/account/addresses");
  return sortAddresses((response.addresses ?? []).map(mapBackendAddress));
}

export async function getAddressByType(
  type: AddressType
): Promise<DeliveryAddress | null> {
  const addresses = await getAddresses();
  return addresses.find((item) => item.type === type) ?? null;
}

function findMatchingAddress(
  addresses: DeliveryAddress[],
  data: AddressFormData
): DeliveryAddress | null {
  return (
    addresses.find(
      (item) =>
        item.street.trim().toLowerCase() === data.street.trim().toLowerCase() &&
        item.city.trim().toLowerCase() === data.city.trim().toLowerCase() &&
        item.state.trim().toLowerCase() === data.state.trim().toLowerCase() &&
        item.zipCode.trim().toLowerCase() === data.zipCode.trim().toLowerCase() &&
        item.country?.trim().toLowerCase() === data.country.trim().toLowerCase()
    ) ?? null
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
    fullName: buildFullName(data, existing?.fullName ?? ""),
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    email: data.email.trim(),
    country: data.country.trim(),
    street: data.street,
    apartment: data.apartment.trim(),
    city: data.city,
    state: data.state,
    zipCode: data.zipCode,
    phone: data.phone,
    isShippingAddress: data.isShippingAddress,
    isBillingAddress: data.isBillingAddress,
    isDefault: existing?.isDefault ?? addresses.length === 0,
  };

  if (existing?.id) {
    const response = await apiRequestWithSessionRetry<BackendAddressWriteResponse>(
      `/api/account/addresses/${encodeURIComponent(existing.id)}`,
      {
        method: "PUT",
        body: toBackendPayload(data),
      }
    );
    if (response.address) {
      return mapBackendAddress(response.address);
    }

    const refreshed = await getAddresses();
    return refreshed.find((item) => item.id === existing.id) ?? address;
  }

  await apiRequestWithSessionRetry<BackendAddressWriteResponse>("/api/account/addresses", {
    method: "POST",
    body: toBackendPayload(data),
  });
  const refreshed = await getAddresses();
  return findMatchingAddress(refreshed, data) ?? refreshed[0] ?? address;
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
    fullName: buildFullName(data, existing?.fullName ?? ""),
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    email: data.email.trim(),
    country: data.country.trim(),
    street: data.street.trim(),
    apartment: data.apartment.trim(),
    city: data.city.trim(),
    state: data.state.trim(),
    zipCode: data.zipCode.trim(),
    phone: data.phone.trim(),
    isShippingAddress: data.isShippingAddress,
    isBillingAddress: data.isBillingAddress,
    isDefault: existing?.isDefault ?? addresses.length === 0,
  };

  if (existingId) {
    const response = await apiRequestWithSessionRetry<BackendAddressWriteResponse>(
      `/api/account/addresses/${encodeURIComponent(existingId)}`,
      {
        method: "PUT",
        body: toBackendPayload(data),
      }
    );
    if (response.address) {
      return mapBackendAddress(response.address);
    }
    const refreshed = await getAddresses();
    return refreshed.find((item) => item.id === existingId) ?? address;
  }

  await apiRequestWithSessionRetry<BackendAddressWriteResponse>("/api/account/addresses", {
    method: "POST",
    body: toBackendPayload(data),
  });
  const refreshed = await getAddresses();
  return findMatchingAddress(refreshed, data) ?? refreshed[0] ?? address;
}

export async function deleteAddress(id: string): Promise<void> {
  await apiRequestWithSessionRetry<{ success: boolean }>(`/api/account/addresses/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function setDefaultAddress(id: string): Promise<void> {
  await apiRequestWithSessionRetry<{ success: boolean }>(
    `/api/account/addresses/${encodeURIComponent(id)}/default`,
    {
      method: "PATCH",
    }
  );
}

export function formatFullAddress(address: DeliveryAddress): string {
  const country = address.country?.trim();
  if (country) {
    return `${address.street}, ${address.city}, ${address.state} ${address.zipCode}, ${country}`;
  }
  return `${address.street}, ${address.city}, ${address.state} ${address.zipCode}`;
}

export function formatAddressLine(address: DeliveryAddress): string {
  const country = address.country?.trim();
  if (country) {
    return `${address.city}, ${address.state} ${address.zipCode}, ${country}`;
  }
  return `${address.city}, ${address.state} ${address.zipCode}`;
}
