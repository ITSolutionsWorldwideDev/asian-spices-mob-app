export type AddressType = "home" | "office" | "other";

export const ADDRESS_LABELS: Record<AddressType, string> = {
  home: "Home",
  office: "Office",
  other: "Other",
};

export const ADDRESS_TYPES: AddressType[] = ["home", "office", "other"];

export type DeliveryAddress = {
  id: string;
  type: AddressType;
  label: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  country?: string;
  street: string;
  apartment?: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  isShippingAddress?: boolean;
  isBillingAddress?: boolean;
  isDefault?: boolean;
};

export type AddressFormData = {
  type: AddressType;
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  country: string;
  street: string;
  apartment: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  isShippingAddress: boolean;
  isBillingAddress: boolean;
};

export function createEmptyAddressForm(type: AddressType = "home"): AddressFormData {
  return {
    type,
    fullName: "",
    firstName: "",
    lastName: "",
    email: "",
    country: "",
    street: "",
    apartment: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
    isShippingAddress: true,
    isBillingAddress: true,
  };
}

function splitFullName(fullName: string) {
  const trimmed = fullName.trim();
  if (!trimmed) {
    return { firstName: "", lastName: "" };
  }
  const parts = trimmed.split(/\s+/);
  const firstName = parts[0] ?? "";
  const lastName = parts.slice(1).join(" ");
  return { firstName, lastName };
}

export function addressToFormData(address: DeliveryAddress): AddressFormData {
  const split = splitFullName(address.fullName ?? "");
  return {
    type: address.type,
    fullName: address.fullName ?? "",
    firstName: address.firstName ?? split.firstName,
    lastName: address.lastName ?? split.lastName,
    email: address.email ?? "",
    country: address.country ?? "",
    street: address.street,
    apartment: address.apartment ?? "",
    city: address.city,
    state: address.state,
    zipCode: address.zipCode,
    phone: address.phone,
    isShippingAddress: address.isShippingAddress ?? true,
    isBillingAddress: address.isBillingAddress ?? true,
  };
}

export function isAddressFormComplete(values: AddressFormData): boolean {
  return (
    values.country.trim().length > 0 &&
    values.street.trim().length > 0 &&
    values.city.trim().length > 0 &&
    values.state.trim().length > 0 &&
    values.zipCode.trim().length > 0 &&
    (values.isShippingAddress || values.isBillingAddress)
  );
}
