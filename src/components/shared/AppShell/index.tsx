"use client";

import { type ReactNode } from "react";

import { Sidebar } from "@/components/shared/Sidebar";
import { TopNav } from "@/components/shared/TopNav";
import { MobileNav } from "@/components/shared/MobileNav";
import { MobileSidebar } from "./mobile-sidebar";
import { SandboxBanner } from "@/app/(dashboard)/sandbox-banner";
import { PageHeader } from "@/components/shared/PageHeader";

import { SandboxTour } from "@/components/shared/SandboxTour";
import { ToastRenderer } from "@/components/shared/ToastRenderer";
import { usePracticeStore } from "@/stores/practice-store";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const isOpen = usePracticeStore((s) => s.sidebarOpen);

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-muted/50 lg:p-2">
      <Sidebar />
      <MobileSidebar />
      <div
        className={cn(
          "flex flex-col transition-all duration-300 lg:gap-2 lg:h-[calc(100vh-1rem)]",
          isOpen ? "lg:ml-[15.5rem]" : "lg:ml-[4.5rem]"
        )}
      >
        <div className="sticky top-0 z-20 lg:static shrink-0">
          <div className="lg:rounded-2xl lg:border lg:border-border/60 lg:bg-background/95 lg:backdrop-blur lg:shadow-sm lg:overflow-clip">
            <SandboxBanner />
            <TopNav />
          </div>
        </div>
        <main className="flex-1 min-h-0 flex flex-col lg:rounded-2xl lg:border lg:border-border/60 lg:bg-background lg:shadow-sm lg:overflow-hidden">
          <PageHeader />
          <div className="flex-1 min-h-0 p-4 pt-4 lg:p-6 lg:pt-6 pb-20 lg:pb-6 lg:overflow-y-auto scrollbar-thin">
            {children}
          </div>
        </main>
      </div>
      <MobileNav />
      <SandboxTour />

      <ToastRenderer />
    </div>
  );
}