import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type Practice } from "@/types/app.types";

interface PracticeStore {
  activePracticeId: string | null;
  activePractice: Practice | null;
  sidebarOpen: boolean;
  isMobileNavOpen: boolean;
  setActivePractice: (practice: Practice) => void;
  clearPractice: () => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleMobileNav: () => void;
  setMobileNavOpen: (open: boolean) => void;
}

export const usePracticeStore = create<PracticeStore>()(
  persist(
    (set) => ({
      activePracticeId: null,
      activePractice: null,
      sidebarOpen: true,
      isMobileNavOpen: false,
      setActivePractice: (practice) =>
        set({ activePractice: practice, activePracticeId: practice.id }),
      clearPractice: () =>
        set({ activePractice: null, activePracticeId: null }),
      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleMobileNav: () =>
        set((state) => ({ isMobileNavOpen: !state.isMobileNavOpen })),
      setMobileNavOpen: (open) => set({ isMobileNavOpen: open }),
    }),
    {
      name: "practice-store",
      partialize: (state) => ({
        activePracticeId: state.activePracticeId,
        activePractice: state.activePractice,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);
