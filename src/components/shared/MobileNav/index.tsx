"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Zap,
  Inbox,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type NavItem } from "@/types/navigation";

const mobileNavItems: NavItem[] = [
  { title: "Home", href: "/dashboard", icon: LayoutDashboard },
  { title: "Patients", href: "/patients", icon: Users },
  { title: "Sequences", href: "/sequences", icon: Zap },
  { title: "Inbox", href: "/inbox", icon: Inbox, badge: 3 },
  { title: "Analytics", href: "/analytics", icon: BarChart3 },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex h-16 items-center justify-around border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:hidden">
      {mobileNavItems.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-2 text-xs transition-colors",
              isActive
                ? "text-primary font-medium"
                : "text-muted-foreground"
            )}
          >
            <div className="relative">
              <item.icon className="h-5 w-5" />
              {item.badge && (
                <span className="absolute -top-1 -right-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
                  {item.badge}
                </span>
              )}
            </div>
            <span>{item.title}</span>
          </Link>
        );
      })}
    </nav>
  );
}