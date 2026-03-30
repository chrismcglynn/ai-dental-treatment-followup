"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { useUiStore, type Toast } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

const VARIANT_STYLES: Record<NonNullable<Toast["variant"]>, string> = {
  default: "border-border bg-background text-foreground",
  success:
    "border-l-4 border-l-green-500 border-border bg-background text-foreground",
  destructive:
    "border-l-4 border-l-red-500 border-border bg-background text-foreground",
};

const AUTO_DISMISS_MS: Record<NonNullable<Toast["variant"]>, number> = {
  default: 4000,
  success: 6000,
  destructive: 6000,
};

function ToastItem({ toast }: { toast: Toast }) {
  const removeToast = useUiStore((s) => s.removeToast);
  const variant = toast.variant ?? "default";

  useEffect(() => {
    const timer = setTimeout(
      () => removeToast(toast.id),
      AUTO_DISMISS_MS[variant]
    );
    return () => clearTimeout(timer);
  }, [toast.id, variant, removeToast]);

  return (
    <div
      role="alert"
      className={cn(
        "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border p-4 shadow-lg animate-in slide-in-from-right-full fade-in duration-200",
        VARIANT_STYLES[variant]
      )}
    >
      <div className="flex-1 space-y-1">
        <p className="text-sm font-semibold leading-none">{toast.title}</p>
        {toast.description && (
          <p className="text-sm text-muted-foreground">{toast.description}</p>
        )}
      </div>
      <button
        onClick={() => removeToast(toast.id)}
        className="shrink-0 rounded-md p-0.5 text-muted-foreground hover:text-foreground"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ToastRenderer() {
  const toasts = useUiStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-4 left-4 z-[100] flex w-full max-w-sm flex-col-reverse gap-2 sm:left-auto sm:right-4"
    >
      {toasts.slice(-5).map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
