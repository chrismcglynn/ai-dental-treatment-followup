"use client";

import { FlaskConical, Play, Square, RotateCcw, Plug } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSandbox, type SimulationSpeed } from "@/lib/sandbox";
import { useSimulationEngine } from "@/lib/sandbox/simulationEngine";
import { useRouter } from "next/navigation";

export function SandboxBanner() {
  const {
    isSandbox,
    simulationActive,
    simulationSpeed,
    toggleSimulation,
    setSimulationSpeed,
    resetSandbox,
  } = useSandbox();

  const router = useRouter();

  // Mount the simulation engine so it runs while the banner is rendered
  useSimulationEngine();

  if (!isSandbox) return null;

  return (
    <div
      role="status"
      aria-label="Sandbox mode active"
      className="relative z-50 flex flex-wrap items-center justify-between gap-2 border-b border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-200"
    >
      <div className="flex items-center gap-2">
        <FlaskConical className="h-4 w-4 shrink-0" />
        <span className="font-medium">Sandbox Mode</span>
        <span className="hidden sm:inline">
          — This is demo data. No real messages are being sent.
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Start / Stop simulation */}
        <Button
          variant="outline"
          size="sm"
          onClick={toggleSimulation}
          className="h-7 gap-1.5 border-amber-300 bg-white/60 text-amber-900 hover:bg-white/80 dark:border-amber-700 dark:bg-amber-900/40 dark:text-amber-200 dark:hover:bg-amber-900/60"
        >
          {simulationActive ? (
            <>
              <Square className="h-3 w-3" />
              Stop
            </>
          ) : (
            <>
              <Play className="h-3 w-3" />
              Start simulation
            </>
          )}
        </Button>

        {/* Speed selector */}
        <Select
          value={simulationSpeed}
          onValueChange={(val) => setSimulationSpeed(val as SimulationSpeed)}
        >
          <SelectTrigger className="h-7 w-[110px] border-amber-300 bg-white/60 text-xs text-amber-900 dark:border-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="normal">Normal (30s)</SelectItem>
            <SelectItem value="fast">Fast (10s)</SelectItem>
            <SelectItem value="10x">10x (3s)</SelectItem>
          </SelectContent>
        </Select>

        {/* Reset sandbox */}
        <Button
          variant="outline"
          size="sm"
          onClick={resetSandbox}
          className="h-7 gap-1.5 border-amber-300 bg-white/60 text-amber-900 hover:bg-white/80 dark:border-amber-700 dark:bg-amber-900/40 dark:text-amber-200 dark:hover:bg-amber-900/60"
        >
          <RotateCcw className="h-3 w-3" />
          <span className="hidden sm:inline">Reset</span>
        </Button>

        {/* Connect real PMS CTA */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                onClick={() => router.push("/settings/integrations")}
                className="h-7 gap-1.5 bg-amber-700 text-white hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-500"
              >
                <Plug className="h-3 w-3" />
                <span className="hidden sm:inline">Connect real PMS</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[240px] text-center">
              Ready to connect your real practice? Your sequences and settings
              will carry over.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
