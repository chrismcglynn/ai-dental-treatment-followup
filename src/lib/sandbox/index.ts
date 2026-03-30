"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { createElement } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSandboxStore, type SandboxActivity, type SandboxStore } from "@/stores/sandbox-store";
import {
  listenForPortalBroadcasts,
  type PortalBroadcastMessage,
} from "@/lib/sandbox/portalBroadcast";

// ─── Types ───────────────────────────────────────────────────────────────────

export type SimulationSpeed = "normal" | "fast" | "10x";

interface SandboxContextValue {
  /** Whether the current session is running in sandbox mode. */
  isSandbox: boolean;

  /** The sandbox Zustand store (getters, mutations, simulation helpers). */
  sandboxStore: SandboxStore;

  /** Whether the background simulation engine is running. */
  simulationActive: boolean;

  /** Current simulation speed. */
  simulationSpeed: SimulationSpeed;

  /** Activity feed from the simulation engine. */
  activityFeed: SandboxActivity[];

  /** Start the simulation engine. */
  startSimulation: () => void;

  /** Stop the simulation engine. */
  stopSimulation: () => void;

  /** Toggle simulation on/off. */
  toggleSimulation: () => void;

  /** Change simulation speed. */
  setSimulationSpeed: (speed: SimulationSpeed) => void;

  /** Reset all sandbox data to initial seed state. */
  resetSandbox: () => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const SandboxContext = createContext<SandboxContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

interface SandboxProviderProps {
  children: ReactNode;
  /** Enable sandbox mode. Defaults to true when this provider is rendered. */
  enabled?: boolean;
  /** Initial simulation speed. Defaults to "normal". */
  initialSpeed?: SimulationSpeed;
  /** Auto-start simulation on mount. Defaults to false. */
  autoStart?: boolean;
}

export function SandboxProvider({
  children,
  enabled = true,
  initialSpeed = "normal",
  autoStart = false,
}: SandboxProviderProps) {
  const store = useSandboxStore();
  const [simulationActive, setSimulationActive] = useState(false);
  const [simulationSpeed, setSimulationSpeed] =
    useState<SimulationSpeed>(initialSpeed);

  const queryClient = useQueryClient();

  // Auto-start simulation after a short delay (for /demo page)
  useEffect(() => {
    if (!enabled || !autoStart) return;
    const timer = setTimeout(() => setSimulationActive(true), 3000);
    return () => clearTimeout(timer);
  }, [enabled, autoStart]);

  // Listen for portal booking broadcasts from other tabs
  useEffect(() => {
    if (!enabled) return;

    return listenForPortalBroadcasts((data: PortalBroadcastMessage) => {
      if (data.type === "portal_booking") {
        // Apply the booking changes to this tab's store
        store.updateTreatment(data.treatmentId, data.treatmentUpdate as { status: "accepted"; decided_at: string });
        const currentStats = store.getDashboardStats();
        store.updateDashboardStats({
          revenue_recovered: currentStats.revenue_recovered + data.revenueRecovered,
        });
        store.addActivityFeedItem(data.activityItem);
        store.addMessage(data.message);
        if (data.conversationUpdate) {
          store.updateConversation(
            data.conversationUpdate.conversationId,
            data.conversationUpdate.data
          );
        }

        // Invalidate React Query caches so inbox/dashboard re-render
        queryClient.invalidateQueries({ queryKey: ["inbox"] });
        queryClient.invalidateQueries({ queryKey: ["patients"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        queryClient.invalidateQueries({ queryKey: ["analytics"] });
      }
    });
  }, [enabled, store, queryClient]);

  const startSimulation = useCallback(() => setSimulationActive(true), []);
  const stopSimulation = useCallback(() => setSimulationActive(false), []);
  const toggleSimulation = useCallback(
    () => setSimulationActive((prev) => !prev),
    []
  );

  const resetSandbox = useCallback(() => {
    setSimulationActive(false);
    store.reset();
  }, [store]);

  const value: SandboxContextValue = {
    isSandbox: enabled,
    sandboxStore: store,
    simulationActive,
    simulationSpeed,
    activityFeed: store.activityFeed,
    startSimulation,
    stopSimulation,
    toggleSimulation,
    setSimulationSpeed,
    resetSandbox,
  };

  return createElement(SandboxContext.Provider, { value }, children);
}

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * Access sandbox context. Returns `{ isSandbox: false }` when used outside
 * a SandboxProvider, so hooks can safely call `useSandbox()` unconditionally.
 */
export function useSandbox(): SandboxContextValue {
  const ctx = useContext(SandboxContext);

  if (!ctx) {
    // Return a safe no-op default when not inside SandboxProvider.
    // This allows hooks to always call useSandbox() without conditional logic.
    return NO_SANDBOX;
  }

  return ctx;
}

/** Static singleton for non-sandbox mode — avoids re-creating objects.
 *  sandboxStore is set to the real store instance so TypeScript infers
 *  correct return types through hooks. It's safe because isSandbox=false
 *  means the sandbox branch in queryFn is never reached at runtime. */
const NO_SANDBOX: SandboxContextValue = {
  isSandbox: false,
  sandboxStore: useSandboxStore.getState() as SandboxStore,
  simulationActive: false,
  simulationSpeed: "normal",
  activityFeed: [],
  startSimulation: () => {},
  stopSimulation: () => {},
  toggleSimulation: () => {},
  setSimulationSpeed: () => {},
  resetSandbox: () => {},
};
