"use client";

import { useCallback } from "react";
import { useUiStore } from "@/stores/ui-store";

export function PageHeader() {
  const header = useUiStore((s) => s.pageHeader);
  const setPortalSearchEl = useUiStore((s) => s.setPortalSearchEl);
  const setPortalActionsEl = useUiStore((s) => s.setPortalActionsEl);

  const searchRef = useCallback(
    (node: HTMLDivElement | null) => setPortalSearchEl(node),
    [setPortalSearchEl]
  );
  const actionsRef = useCallback(
    (node: HTMLDivElement | null) => setPortalActionsEl(node),
    [setPortalActionsEl]
  );

  if (!header) return null;

  const { search, actions, portalToolbar } = header;
  if (!search && !actions && !portalToolbar) return null;

  return (
    <div className="flex items-center gap-4 px-4 lg:px-6 pb-2 pt-6 bg-background lg:bg-transparent border-b lg:border-0 border-border">
      <div className="flex-1 flex items-center gap-3">
        {portalToolbar && <div ref={searchRef} className="flex-1 flex items-center" />}
        {search}
      </div>
      <div className="flex items-center gap-2">
        {portalToolbar && <div ref={actionsRef} className="flex items-center gap-2" />}
        {actions}
      </div>
    </div>
  );
}
