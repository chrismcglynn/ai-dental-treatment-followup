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
  ChevronsUpDown,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePracticeStore } from "@/stores/practice-store";
import { useInboxStore } from "@/stores/inbox-store";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type NavItem } from "@/types/navigation";
import { SidebarUserMenu } from "./user-menu";

const mainNavItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Patients", href: "/patients", icon: Users, badge: 142 },
  { title: "Sequences", href: "/sequences", icon: Zap },
  { title: "Inbox", href: "/inbox", icon: Inbox, badge: 5 },
  { title: "Analytics", href: "/analytics", icon: BarChart3 },
];

const bottomNavItems: NavItem[] = [
  { title: "Settings", href: "/settings", icon: Settings },
];

const practices = [
  { id: "1", name: "Bright Smiles", subtitle: "Dr. Smith's Practice" },
  { id: "2", name: "Downtown Dental", subtitle: "Dr. Patel's Office" },
];

export function Sidebar() {
  const pathname = usePathname();
  const isOpen = usePracticeStore((s) => s.sidebarOpen);
  const toggle = usePracticeStore((s) => s.toggleSidebar);

  const activePractice = practices[0];

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col fixed inset-y-0 left-0 z-30 border-r transition-all duration-300",
        "bg-[hsl(var(--sidebar-bg))] text-[hsl(var(--sidebar-fg))]",
        isOpen ? "w-60" : "w-16"
      )}
    >
      {/* Practice Switcher */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex h-14 w-full items-center px-4 border-b border-white/10 hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-3 overflow-hidden flex-1">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--sidebar-active))]">
                <Building2 className="h-4 w-4 text-[hsl(var(--sidebar-active-fg))]" />
              </div>
              {isOpen && (
                <div className="flex flex-col overflow-hidden flex-1">
                  <span className="text-sm font-semibold truncate text-left">
                    {activePractice.name}
                  </span>
                  <span className="text-xs text-[hsl(var(--sidebar-fg))]/60 truncate text-left">
                    {activePractice.subtitle}
                  </span>
                </div>
              )}
              {isOpen && (
                <ChevronsUpDown className="h-4 w-4 shrink-0 text-[hsl(var(--sidebar-fg))]/50" />
              )}
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {practices.map((practice) => (
            <DropdownMenuItem key={practice.id} className="flex items-center gap-2">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary/10">
                <Building2 className="h-3 w-3 text-primary" />
              </div>
              <div className="flex flex-col flex-1">
                <span className="text-sm font-medium">{practice.name}</span>
                <span className="text-xs text-muted-foreground">
                  {practice.subtitle}
                </span>
              </div>
              {practice.id === activePractice.id && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

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
        <SidebarUserMenu collapsed={!isOpen} />
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
  const inboxUnread = useInboxStore((s) => s.unreadCount);
  const badgeValue = isInbox ? inboxUnread : item.badge;
  const hasBadge = badgeValue && Number(badgeValue) > 0;

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
                isInbox
                  ? "bg-primary text-primary-foreground animate-pulse"
                  : "bg-primary/20 text-[hsl(var(--sidebar-active))]"
              )}
            >
              {badgeValue}
            </span>
          )}
        </>
      )}
      {!isOpen && hasBadge && isInbox && (
        <span className="absolute right-2 h-2 w-2 rounded-full bg-primary animate-pulse" />
      )}
    </Link>
  );
}
