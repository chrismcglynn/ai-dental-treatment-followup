import { create } from "zustand";

export type InboxFilter = "all" | "urgent" | "unread" | "needs_reply" | "replied";

interface InboxStore {
  selectedConversationId: string | null;
  pendingPatientId: string | null;
  filter: InboxFilter;
  setSelectedConversation: (id: string | null) => void;
  setPendingPatientId: (id: string | null) => void;
  setFilter: (filter: InboxFilter) => void;
}

export const useInboxStore = create<InboxStore>((set) => ({
  selectedConversationId: null,
  pendingPatientId: null,
  filter: "all",
  setSelectedConversation: (id) => set({ selectedConversationId: id }),
  setPendingPatientId: (id) => set({ pendingPatientId: id }),
  setFilter: (filter) => set({ filter }),
}));
