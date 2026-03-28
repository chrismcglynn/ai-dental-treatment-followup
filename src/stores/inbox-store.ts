import { create } from "zustand";

export type InboxFilter = "all" | "unread" | "needs_reply" | "replied";

interface InboxStore {
  selectedConversationId: string | null;
  unreadCount: number;
  filter: InboxFilter;
  setSelectedConversation: (id: string | null) => void;
  setUnreadCount: (count: number | ((prev: number) => number)) => void;
  setFilter: (filter: InboxFilter) => void;
}

export const useInboxStore = create<InboxStore>((set) => ({
  selectedConversationId: null,
  unreadCount: 0,
  filter: "all",
  setSelectedConversation: (id) => set({ selectedConversationId: id }),
  setUnreadCount: (count) =>
    set((state) => ({
      unreadCount: typeof count === "function" ? count(state.unreadCount) : count,
    })),
  setFilter: (filter) => set({ filter }),
}));
