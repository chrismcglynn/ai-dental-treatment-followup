"use client";

import { useEffect, useRef } from "react";
import { useUiStore, type PageHeaderState } from "@/stores/ui-store";

export function usePageHeader(header: PageHeaderState) {
  const setPageHeader = useUiStore((s) => s.setPageHeader);
  const headerRef = useRef(header);
  headerRef.current = header;

  // Set header on mount and whenever it changes
  useEffect(() => {
    setPageHeader(header);
  });

  // Clear on unmount
  useEffect(() => {
    return () => setPageHeader(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
