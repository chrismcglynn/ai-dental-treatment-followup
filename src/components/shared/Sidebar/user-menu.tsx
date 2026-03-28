"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Settings, User } from "lucide-react";

interface SidebarUserMenuProps {
  collapsed: boolean;
}

export function SidebarUserMenu({ collapsed }: SidebarUserMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-white/5">
          <Avatar className="h-7 w-7 shrink-0">
            <AvatarFallback className="bg-primary/20 text-[hsl(var(--sidebar-active))] text-xs">
              JS
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex flex-col items-start overflow-hidden">
              <span className="text-sm font-medium truncate text-[hsl(var(--sidebar-fg))]">
                Jane Smith
              </span>
              <span className="text-xs text-[hsl(var(--sidebar-fg))]/50 truncate">
                Practice Manager
              </span>
            </div>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem>
          <User className="mr-2 h-4 w-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}