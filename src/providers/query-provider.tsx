"use client";

import { QueryClientProvider, QueryErrorResetBoundary } from "@tanstack/react-query";
import { type ReactNode } from "react";
import { queryClient } from "@/lib/queryClient";

export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <QueryErrorResetBoundary>{children}</QueryErrorResetBoundary>
    </QueryClientProvider>
  );
}
