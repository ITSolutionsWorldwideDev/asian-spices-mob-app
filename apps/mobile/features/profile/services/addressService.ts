import { refreshNextAuthSession } from "@/features/auth/services/authService";
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

function inferAddressType(label: string): AddressType {
  const normalized = label.trim().toLowerCase();
  if (normalized === "office") return "office";
  if (normalized === "home") return "home";
  return "other";
}

function mapBackendAddress(row: BackendAddress): DeliveryAddress {
  const firstName = row.first_name?.trim() ?? "";
  const lastName = row.last_name?.trim() ?? "";
  const fullName = `${firstName} ${lastName}`.trim();
  const label = row.label?.trim() || "Other";
  let isShippingAddress = row.is_shipping_address ?? true;
  let isBillingAddress = row.is_billing_address ?? true;
  if (!isShippingAddress && !isBillingAddress) {
    isShippingAddress = true;
    isBillingAddress = true;
  }

  return normalizeAddress({
    id: String(row.id),
    type: inferAddressType(label),
    label,
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
    isShippingAddress,
    isBillingAddress,
    isDefault: Boolean(row.is_default),
  });
}

function toBackendPayload(data: AddressFormData, existingLabel?: string) {
  const isShippingAddress = Boolean(data.isShippingAddress);
  const isBillingAddress = Boolean(data.isBillingAddress);
  const fullName = buildFullName(data);
  const splitName = fullName
    ? {
        firstName: fullName.split(/\s+/)[0] ?? "",
        lastName: fullName.split(/\s+/).slice(1).join(" "),
      }
    : {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
      };

  return {
    label:
      data.label?.trim() ||
      existingLabel?.trim() ||
      ADDRESS_LABELS[data.type],
    address_line1: data.street.trim(),
    address_line2: data.apartment.trim() || undefined,
    city: data.city.trim(),
    state: data.state.trim() || undefined,
    postal_code: data.zipCode.trim(),
    country: data.country.trim(),
    first_name: splitName.firstName || undefined,
    last_name: splitName.lastName || undefined,
    phone: data.phone.trim() || undefined,
    is_shipping_address: isShippingAddress || !isBillingAddress,
    is_billing_address: isBillingAddress || !isShippingAddress,
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
  const label =
    data.label?.trim() || existing?.label?.trim() || ADDRESS_LABELS[data.type];
  const fallbackAddress: DeliveryAddress = {
    id: existing?.id ?? `addr-${data.type}`,
    type: data.type,
    label,
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
    await apiRequestWithSessionRetry<BackendAddressWriteResponse>(
      `/api/account/addresses/${encodeURIComponent(existing.id)}`,
      {
        method: "PUT",
        body: toBackendPayload(data, existing.label),
      }
    );

    const refreshed = await getAddresses();
    return refreshed.find((item) => item.id === existing.id) ?? fallbackAddress;
  }

  await apiRequestWithSessionRetry<BackendAddressWriteResponse>("/api/account/addresses", {
    method: "POST",
    body: toBackendPayload(data),
  });
  const refreshed = await getAddresses();
  return findMatchingAddress(refreshed, data) ?? refreshed[0] ?? fallbackAddress;
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
  const label =
    data.label?.trim() || existing?.label?.trim() || ADDRESS_LABELS[data.type];

  const fallbackAddress: DeliveryAddress = {
    id: existingId ?? `addr-${Date.now()}`,
    type: data.type,
    label,
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
        body: toBackendPayload(data, existing?.label),
      }
    );

    const refreshed = await getAddresses();
    const fromRefresh = refreshed.find((item) => item.id === existingId);
    if (fromRefresh) return fromRefresh;
    if (response.address) return mapBackendAddress(response.address);
    return fallbackAddress;
  }

  const response = await apiRequestWithSessionRetry<BackendAddressWriteResponse>(
    "/api/account/addresses",
    {
      method: "POST",
      body: toBackendPayload(data),
    }
  );

  const refreshed = await getAddresses();
  if (response.address) {
    const mapped = mapBackendAddress(response.address);
    return refreshed.find((item) => item.id === mapped.id) ?? mapped;
  }
  return findMatchingAddress(refreshed, data) ?? refreshed[0] ?? fallbackAddress;
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
