// apps/web/store/useLoaderStore.ts

import { create } from "zustand";

type LoaderState = {
  loading: boolean;
  message?: string;
  show: (msg?: string) => void;
  hide: () => void;
};

export const useLoaderStore = create<LoaderState>((set) => ({
  loading: false,
  message: "",
  show: (msg = "Please wait...") =>
    set({ loading: true, message: msg }),
  hide: () => set({ loading: false, message: "" }),
}));