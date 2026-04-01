import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AppNotification {
  id: string;
  title: string;
  description?: string;
  type: "booking" | "reply" | "info";
  read: boolean;
  timestamp: string;
  patientId?: string;
}

interface NotificationStore {
  notifications: AppNotification[];
  addNotification: (notification: Omit<AppNotification, "id" | "read" | "timestamp">) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clearAll: () => void;
  unreadCount: () => number;
}

let notifCounter = 0;

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      notifications: [],
      addNotification: (notification) =>
        set((state) => ({
          notifications: [
            {
              ...notification,
              id: `notif-${++notifCounter}-${Date.now()}`,
              read: false,
              timestamp: new Date().toISOString(),
            },
            ...state.notifications,
          ].slice(0, 50), // Keep last 50
        })),
      markRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),
      markAllRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        })),
      clearAll: () => set({ notifications: [] }),
      unreadCount: () => get().notifications.filter((n) => !n.read).length,
    }),
    {
      name: "notification-store-v2",
      partialize: (state) => ({ notifications: state.notifications }),
    }
  )
);
