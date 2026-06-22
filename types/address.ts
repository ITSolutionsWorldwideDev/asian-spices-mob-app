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
  street: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  isDefault?: boolean;
};

export type AddressFormData = {
  type: AddressType;
  fullName: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
};

export function createEmptyAddressForm(type: AddressType = "home"): AddressFormData {
  return {
    type,
    fullName: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
  };
}

export function addressToFormData(address: DeliveryAddress): AddressFormData {
  return {
    type: address.type,
    fullName: address.fullName ?? "",
    street: address.street,
    city: address.city,
    state: address.state,
    zipCode: address.zipCode,
    phone: address.phone,
  };
}

export function isAddressFormComplete(values: AddressFormData): boolean {
  return (
    values.fullName.trim().length > 0 &&
    values.street.trim().length > 0 &&
    values.city.trim().length > 0 &&
    values.state.trim().length > 0 &&
    values.zipCode.trim().length > 0 &&
    values.phone.trim().length > 0
  );
}
