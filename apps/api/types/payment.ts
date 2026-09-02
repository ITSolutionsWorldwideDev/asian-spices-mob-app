// apps/web/types/payment.ts

export interface CreatePaymentRequest {
  amount: number;
  orderId: string;
  customerEmail: string;
}

export interface CreatePaymentResponse {
  redirectUrl?: string;
  transactionId?: string;
  error?: string;
}

export type PaymentStatus = 'pending' | 'paid' | 'failed';