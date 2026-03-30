import { create } from "zustand";

export type InboxFilter = "all" | "unread" | "needs_reply" | "replied";

interface InboxStore {
  selectedConversationId: string | null;
  filter: InboxFilter;
  setSelectedConversation: (id: string | null) => void;
  setFilter: (filter: InboxFilter) => void;
}

export const useInboxStore = create<InboxStore>((set) => ({
  selectedConversationId: null,
  filter: "all",
  setSelectedConversation: (id) => set({ selectedConversationId: id }),
  setFilter: (filter) => set({ filter }),
}));
