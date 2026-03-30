"use client";

import { useTheme } from "next-themes";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Moon, Sun } from "lucide-react";
import { useSandboxStore } from "@/stores/sandbox-store";

const ROLE_LABELS: Record<string, string> = {
  dentist: "Dentist",
  hygienist: "Hygienist",
  front_office: "Front Office",
  office_manager: "Office Manager",
  dental_assistant: "Dental Assistant",
};

export function SidebarUserMenu() {
  const { theme, setTheme } = useTheme();
  const demoUser = useSandboxStore((s) => s.demoUser);

  const name = demoUser?.full_name ?? "User";
  const role = demoUser?.role ? ROLE_LABELS[demoUser.role] ?? demoUser.role : "";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center rounded-full transition-colors hover:bg-muted p-0.5">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/20 text-primary text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">{name}</p>
          {role && (
            <p className="text-xs text-muted-foreground">{role}</p>
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? (
            <Sun className="mr-2 h-4 w-4" />
          ) : (
            <Moon className="mr-2 h-4 w-4" />
          )}
          {theme === "dark" ? "Light mode" : "Dark mode"}
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
