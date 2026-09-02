// core/types/toast.ts
export type ToastType = "success" | "error"  | "danger" | "primary";

export interface ToastPayload {
  id: number;
  type: ToastType;
  message: string;
}

