"use client";

import { useEffect } from "react";
import { Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePracticeStore } from "@/stores/practice-store";
import { SidebarUserMenu } from "@/components/shared/Sidebar/user-menu";

export function TopNav() {
  const toggleMobile = usePracticeStore((s) => s.toggleMobileNav);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        const input = document.getElementById("global-search");
        input?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={toggleMobile}
        aria-label="Toggle navigation menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex-1 flex items-center gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            id="global-search"
            placeholder="Search patients, sequences..."
            className="flex h-9 w-full rounded-md border border-input bg-muted/50 px-3 py-1 pl-9 pr-16 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <kbd className="pointer-events-none absolute right-2 top-1.5 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
            <span className="text-xs">&#8984;</span>K
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <SidebarUserMenu />
      </div>
    </header>
  );
}
