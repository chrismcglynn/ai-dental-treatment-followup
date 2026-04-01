"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, CalendarCheck, MessageSquare, Info } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useNotificationStore,
  type AppNotification,
} from "@/stores/notification-store";
import { useInboxStore } from "@/stores/inbox-store";

const TYPE_CONFIG: Record<
  AppNotification["type"],
  { icon: React.ElementType; className: string }
> = {
  booking: {
    icon: CalendarCheck,
    className: "text-green-600 dark:text-green-400",
  },
  reply: {
    icon: MessageSquare,
    className: "text-blue-600 dark:text-blue-400",
  },
  info: {
    icon: Info,
    className: "text-muted-foreground",
  },
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const notifications = useNotificationStore((s) => s.notifications);
  const markRead = useNotificationStore((s) => s.markRead);
  const clearAll = useNotificationStore((s) => s.clearAll);
  const unreadCount = useNotificationStore((s) => s.unreadCount());
  const setPendingPatientId = useInboxStore((s) => s.setPendingPatientId);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function handleNotificationClick(notif: AppNotification) {
    markRead(notif.id);
    if (notif.type === "reply") {
      if (notif.patientId) {
        setPendingPatientId(notif.patientId);
      }
      setOpen(false);
      router.push("/inbox");
    }
  }

  return (
    <div className="relative" ref={panelRef}>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setOpen(!open)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-lg border border-border bg-background shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold">Notifications</h3>
            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                className="text-xs text-primary hover:underline"
              >
                Clear all
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="h-6 w-6 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                No notifications yet
              </p>
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto overscroll-contain">
              {notifications.map((notif) => {
                const config = TYPE_CONFIG[notif.type];
                const Icon = config.icon;

                return (
                  <button
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={cn(
                      "w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 border-b border-border last:border-b-0",
                      !notif.read && "bg-primary/5"
                    )}
                  >
                    <div
                      className={cn(
                        "mt-0.5 shrink-0",
                        config.className
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p
                          className={cn(
                            "text-sm truncate",
                            !notif.read ? "font-semibold" : "font-medium"
                          )}
                        >
                          {notif.title}
                        </p>
                        {!notif.read && (
                          <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        )}
                      </div>
                      {notif.description && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {notif.description}
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notif.timestamp), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
