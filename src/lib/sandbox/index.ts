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
import { useSandboxStore, type SandboxActivity } from "@/stores/sandbox-store";

// ─── Types ───────────────────────────────────────────────────────────────────

export type SimulationSpeed = "normal" | "fast" | "10x";

interface SandboxContextValue {
  /** Whether the current session is running in sandbox mode. */
  isSandbox: boolean;

  /** The sandbox Zustand store (getters, mutations, simulation helpers). */
  sandboxStore: ReturnType<typeof useSandboxStore>;

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

  // Auto-start simulation after a short delay (for /demo page)
  useEffect(() => {
    if (!enabled || !autoStart) return;
    const timer = setTimeout(() => setSimulationActive(true), 3000);
    return () => clearTimeout(timer);
  }, [enabled, autoStart]);

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

/** Static singleton for non-sandbox mode — avoids re-creating objects. */
const NO_SANDBOX: SandboxContextValue = {
  isSandbox: false,
  sandboxStore: null as unknown as SandboxContextValue["sandboxStore"],
  simulationActive: false,
  simulationSpeed: "normal",
  activityFeed: [],
  startSimulation: () => {},
  stopSimulation: () => {},
  toggleSimulation: () => {},
  setSimulationSpeed: () => {},
  resetSandbox: () => {},
};
