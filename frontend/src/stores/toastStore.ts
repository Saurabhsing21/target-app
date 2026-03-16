import { create } from "zustand";
import { devtools } from "zustand/middleware";

export type Toast = {
  id: string;
  title: string;
  message?: string;
  kind?: "info" | "success" | "error";
};

type ToastState = {
  toasts: Toast[];
  push: (toast: Omit<Toast, "id">) => void;
  remove: (id: string) => void;
};

function id() {
  return Math.random().toString(16).slice(2);
}

export const useToastStore = create<ToastState>()(
  devtools((set) => ({
    toasts: [],
    push: (toast) => set((state) => ({ toasts: [...state.toasts, { ...toast, id: id() }] })),
    remove: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  })),
);

