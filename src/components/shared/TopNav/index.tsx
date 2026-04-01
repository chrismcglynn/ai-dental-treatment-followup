"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePracticeStore } from "@/stores/practice-store";
import { SidebarUserMenu } from "@/components/shared/Sidebar/user-menu";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { useUiStore } from "@/stores/ui-store";

export function TopNav() {
  const toggleMobile = usePracticeStore((s) => s.toggleMobileNav);
  const pageTitle = useUiStore((s) => s.pageHeader?.title);

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={toggleMobile}
        aria-label="Toggle navigation menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {pageTitle && (
        <h1 className="text-lg font-semibold tracking-tight hidden lg:block">
          {pageTitle}
        </h1>
      )}

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <NotificationBell />
        <SidebarUserMenu />
      </div>
    </header>
  );
}
