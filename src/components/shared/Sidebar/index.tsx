"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Zap,
  Inbox,
  BarChart3,
  Settings,
  ChevronLeft,
  Building2,
  ClipboardCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePracticeStore } from "@/stores/practice-store";
import { useUnreadCount } from "@/hooks/useInbox";
import { usePendingTreatments } from "@/hooks/useAnalytics";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type NavItem } from "@/types/navigation";

const mainNavItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Treatments", href: "/treatments/pending", icon: ClipboardCheck },
  { title: "Patients", href: "/patients", icon: Users },
  { title: "Sequences", href: "/sequences", icon: Zap },
  { title: "Inbox", href: "/inbox", icon: Inbox },
  { title: "Analytics", href: "/analytics", icon: BarChart3 },
];

const bottomNavItems: NavItem[] = [
  { title: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const isOpen = usePracticeStore((s) => s.sidebarOpen);
  const toggle = usePracticeStore((s) => s.toggleSidebar);
  const practiceName = usePracticeStore((s) => s.activePractice?.name ?? "My Practice");

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col fixed inset-y-0 left-0 z-30 border-r transition-all duration-300",
        "bg-[hsl(var(--sidebar-bg))] text-[hsl(var(--sidebar-fg))]",
        isOpen ? "w-60" : "w-16"
      )}
    >
      {/* Practice name */}
      <div className="flex h-14 w-full items-center px-4 border-b border-white/10">
        <div className="flex items-center gap-3 overflow-hidden flex-1">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--sidebar-active))]">
            <Building2 className="h-4 w-4 text-[hsl(var(--sidebar-active-fg))]" />
          </div>
          {isOpen && (
            <span className="text-sm font-semibold truncate">
              {practiceName}
            </span>
          )}
        </div>
      </div>

      {/* Main Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-1 px-3">
          {mainNavItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              pathname={pathname}
              isOpen={isOpen}
            />
          ))}
        </nav>
      </ScrollArea>

      <Separator className="bg-white/10" />

      {/* Bottom section: Settings + User */}
      <div className="py-2 px-3">
        <nav className="space-y-1">
          {bottomNavItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              pathname={pathname}
              isOpen={isOpen}
            />
          ))}
        </nav>
      </div>
      <div className="p-3 pt-0 space-y-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggle}
          className="w-full justify-center text-[hsl(var(--sidebar-fg))]/50 hover:text-[hsl(var(--sidebar-fg))] hover:bg-white/5"
        >
          <ChevronLeft
            className={cn(
              "h-4 w-4 transition-transform",
              !isOpen && "rotate-180"
            )}
          />
        </Button>
      </div>
    </aside>
  );
}

function NavLink({
  item,
  pathname,
  isOpen,
}: {
  item: NavItem;
  pathname: string;
  isOpen: boolean;
}) {
  const isActive =
    pathname === item.href || pathname.startsWith(item.href + "/");
  const isInbox = item.title === "Inbox";
  const isTreatments = item.title === "Treatments";
  const inboxUnread = useUnreadCount();
  const { data: pendingCount } = usePendingTreatments();

  const badgeValue = isInbox
    ? inboxUnread
    : isTreatments
    ? pendingCount ?? 0
    : item.badge;
  const hasBadge = badgeValue && Number(badgeValue) > 0;
  const isPulsing = isInbox || isTreatments;

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        isActive
          ? "bg-[hsl(var(--sidebar-active))] text-[hsl(var(--sidebar-active-fg))] font-medium"
          : "text-[hsl(var(--sidebar-fg))]/70 hover:text-[hsl(var(--sidebar-fg))] hover:bg-white/5"
      )}
    >
      <item.icon className="h-4 w-4 shrink-0" />
      {isOpen && (
        <>
          <span className="truncate">{item.title}</span>
          {hasBadge && (
            <span
              className={cn(
                "ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-medium",
                isPulsing
                  ? "bg-primary text-primary-foreground animate-pulse"
                  : "bg-primary/20 text-[hsl(var(--sidebar-active))]"
              )}
            >
              {badgeValue}
            </span>
          )}
        </>
      )}
      {!isOpen && hasBadge && isPulsing && (
        <span className="absolute right-2 h-2 w-2 rounded-full bg-primary animate-pulse" />
      )}
    </Link>
  );
}
