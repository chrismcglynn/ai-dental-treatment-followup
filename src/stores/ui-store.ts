import { create } from "zustand";

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "success" | "destructive";
}

interface ConfirmDialog {
  open: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
}

interface UIStore {
  confirmDialog: ConfirmDialog | null;
  toasts: Toast[];
  openConfirm: (config: Omit<ConfirmDialog, "open">) => void;
  closeConfirm: () => void;
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

let toastCounter = 0;

export const useUiStore = create<UIStore>((set) => ({
  confirmDialog: null,
  toasts: [],
  openConfirm: (config) =>
    set({ confirmDialog: { ...config, open: true } }),
  closeConfirm: () => set({ confirmDialog: null }),
  addToast: (toast) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        { ...toast, id: `toast-${++toastCounter}` },
      ],
    })),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));
