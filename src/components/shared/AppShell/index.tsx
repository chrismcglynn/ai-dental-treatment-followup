"use client";

import { type ReactNode } from "react";
import { Sidebar } from "@/components/shared/Sidebar";
import { TopNav } from "@/components/shared/TopNav";
import { MobileNav } from "@/components/shared/MobileNav";
import { MobileSidebar } from "./mobile-sidebar";
import { usePracticeStore } from "@/stores/practice-store";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const isOpen = usePracticeStore((s) => s.sidebarOpen);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <MobileSidebar />
      <div
        className={cn(
          "flex flex-col transition-all duration-300",
          isOpen ? "lg:ml-60" : "lg:ml-16"
        )}
      >
        <TopNav />
        <main className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6 scrollbar-thin">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}