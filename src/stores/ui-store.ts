import { type ReactNode } from "react";
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

export interface AiSuggestedSequence {
  name: string;
  procedures: string[];
  steps: Array<{
    dayOffset: number;
    channel: "sms" | "email" | "voicemail";
    tone: "friendly" | "clinical" | "urgent";
  }>;
}

export interface PageHeaderState {
  title: string;
  search?: ReactNode;
  actions?: ReactNode;
  /** When true, PageHeader renders empty portal target divs for DataTable to portal into */
  portalToolbar?: boolean;
}

interface UIStore {
  confirmDialog: ConfirmDialog | null;
  toasts: Toast[];
  aiSuggestedSequence: AiSuggestedSequence | null;
  pageHeader: PageHeaderState | null;
  portalSearchEl: HTMLDivElement | null;
  portalActionsEl: HTMLDivElement | null;
  openConfirm: (config: Omit<ConfirmDialog, "open">) => void;
  closeConfirm: () => void;
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  setAiSuggestedSequence: (seq: AiSuggestedSequence | null) => void;
  setPageHeader: (header: PageHeaderState | null) => void;
  setPortalSearchEl: (el: HTMLDivElement | null) => void;
  setPortalActionsEl: (el: HTMLDivElement | null) => void;
}

let toastCounter = 0;

export const useUiStore = create<UIStore>((set) => ({
  confirmDialog: null,
  toasts: [],
  aiSuggestedSequence: null,
  pageHeader: null,
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
  setAiSuggestedSequence: (seq) => set({ aiSuggestedSequence: seq }),
  setPageHeader: (header) => set({ pageHeader: header }),
  portalSearchEl: null,
  portalActionsEl: null,
  setPortalSearchEl: (el) => set({ portalSearchEl: el }),
  setPortalActionsEl: (el) => set({ portalActionsEl: el }),
}));
