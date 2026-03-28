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
  Building2,
  ChevronsUpDown,
  Check,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { usePracticeStore } from "@/stores/practice-store";
import { type NavItem } from "@/types/navigation";
import { SidebarUserMenu } from "@/components/shared/Sidebar/user-menu";

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

export function MobileSidebar() {
  const pathname = usePathname();
  const isMobileOpen = usePracticeStore((s) => s.isMobileNavOpen);
  const setMobileOpen = usePracticeStore((s) => s.setMobileNavOpen);

  const activePractice = practices[0];

  return (
    <Sheet open={isMobileOpen} onOpenChange={setMobileOpen}>
      <SheetContent
        side="left"
        className="w-72 p-0 bg-[hsl(var(--sidebar-bg))] text-[hsl(var(--sidebar-fg))] border-r-0"
      >
        <SheetHeader className="px-4 py-4 border-b border-white/10">
          <SheetTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 text-[hsl(var(--sidebar-fg))] w-full">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(var(--sidebar-active))]">
                    <Building2 className="h-4 w-4 text-[hsl(var(--sidebar-active-fg))]" />
                  </div>
                  <div className="flex flex-col items-start flex-1">
                    <span className="text-sm font-semibold">
                      {activePractice.name}
                    </span>
                    <span className="text-xs font-normal text-[hsl(var(--sidebar-fg))]/60">
                      {activePractice.subtitle}
                    </span>
                  </div>
                  <ChevronsUpDown className="h-4 w-4 text-[hsl(var(--sidebar-fg))]/50" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {practices.map((practice) => (
                  <DropdownMenuItem
                    key={practice.id}
                    className="flex items-center gap-2"
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary/10">
                      <Building2 className="h-3 w-3 text-primary" />
                    </div>
                    <div className="flex flex-col flex-1">
                      <span className="text-sm font-medium">
                        {practice.name}
                      </span>
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
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 py-4">
          <nav className="space-y-1 px-3">
            {mainNavItems.map((item) => {
              const isActive =
                pathname === item.href ||
                pathname.startsWith(item.href + "/");
              const isInbox = item.title === "Inbox";
              const hasBadge = item.badge && Number(item.badge) > 0;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-[hsl(var(--sidebar-active))] text-[hsl(var(--sidebar-active-fg))] font-medium"
                      : "text-[hsl(var(--sidebar-fg))]/70 hover:text-[hsl(var(--sidebar-fg))] hover:bg-white/5"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span>{item.title}</span>
                  {hasBadge && (
                    <span
                      className={cn(
                        "ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-medium",
                        isInbox
                          ? "bg-primary text-primary-foreground animate-pulse"
                          : "bg-primary/20 text-[hsl(var(--sidebar-active))]"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        <Separator className="bg-white/10" />
        <div className="py-2 px-3">
          <nav className="space-y-1">
            {bottomNavItems.map((item) => {
              const isActive =
                pathname === item.href ||
                pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-[hsl(var(--sidebar-active))] text-[hsl(var(--sidebar-active-fg))] font-medium"
                      : "text-[hsl(var(--sidebar-fg))]/70 hover:text-[hsl(var(--sidebar-fg))] hover:bg-white/5"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="p-3 pt-0">
          <SidebarUserMenu collapsed={false} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
