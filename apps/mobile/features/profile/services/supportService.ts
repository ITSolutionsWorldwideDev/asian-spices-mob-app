import { apiRequest } from "@/shared/services/api/httpClient";

export type SupportContactPayload = {
  fullName: string;
  email: string;
  subject: string;
  message: string;
};

export async function sendSupportMessage(payload: SupportContactPayload) {
  return apiRequest<{ success: boolean }>("/api/support/contact", {
    method: "POST",
    body: payload,
  });
}
