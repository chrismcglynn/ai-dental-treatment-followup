"use client";

import { useState } from "react";
import { FlaskConical, Play, Square, RotateCcw, Plug, Loader2 } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSandbox, type SimulationSpeed } from "@/lib/sandbox";
import { useSimulationEngine } from "@/lib/sandbox/simulationEngine";
import { useUiStore } from "@/stores/ui-store";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {usePracticeStore} from "@/stores/practice-store";
import { exitSandboxAction } from "./actions";

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
  const queryClient = useQueryClient();
  const addToast = useUiStore((s) => s.addToast);
  const [resetting, setResetting] = useState(false);
  const [exitDialogOpen, setExitDialogOpen] = useState(false);
  const [exiting, setExiting] = useState(false);

  const activePracticeId = usePracticeStore((s) => s.activePracticeId);
  const activePractice = usePracticeStore((s) => s.activePractice);
  const setActivePractice = usePracticeStore((s) => s.setActivePractice);
  // Mount the simulation engine so it runs while the banner is rendered
  useSimulationEngine();

  if (!isSandbox) return null;

  async function handleReset() {
    setResetting(true);
    resetSandbox();
    queryClient.resetQueries();
    // Brief loading state so the user sees something happened
    await new Promise((r) => setTimeout(r, 500));
    setResetting(false);
    addToast({
      title: "Sandbox reset",
      description: "All demo data restored to initial state",
      variant: "success",
    });
  }

  async function handleExitConfirm() {
    if (!activePracticeId || !activePractice) return;
    setExiting(true);
    const result = await exitSandboxAction(activePracticeId);
    if (result.success) {
      // Update client-side practice store so SandboxWrapper unmounts the provider
      setActivePractice({ ...activePractice, sandbox_mode: false, sandbox_seeded_at: null });
      queryClient.resetQueries();
      setExitDialogOpen(false);
      router.push("/settings/integrations");
    } else {
      setExiting(false);
      addToast({
        title: "Failed to exit sandbox",
        description: result.error ?? "Please try again",
        variant: "destructive",
      });
    }
  }

  return (
    <>
      <div
        role="status"
        aria-label="Sandbox mode active"
        // className="z-50 flex flex-wrap items-center justify-between gap-2 border-b border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-200"
        className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-200"
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
            onClick={handleReset}
            disabled={resetting}
            className="h-7 gap-1.5 border-amber-300 bg-white/60 text-amber-900 hover:bg-white/80 dark:border-amber-700 dark:bg-amber-900/40 dark:text-amber-200 dark:hover:bg-amber-900/60"
          >
            {resetting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <RotateCcw className="h-3 w-3" />
            )}
            <span className="hidden sm:inline">Reset</span>
          </Button>

          {/* Connect real PMS CTA */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  onClick={() => setExitDialogOpen(true)}
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

      {/* Exit sandbox confirmation dialog */}
      <Dialog open={exitDialogOpen} onOpenChange={setExitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ready to go live?</DialogTitle>
            <DialogDescription className="space-y-3 pt-2">
              <span className="block">
                Your 3 sequences are configured and ready to use with real
                patients.
              </span>
              <span className="block">
                When you connect your PMS, we&apos;ll clear the demo data and
                start syncing real treatment plans. Your sequence configurations
                will carry over.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setExitDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExitConfirm} disabled={exiting} className="gap-2">
              {exiting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plug className="h-4 w-4" />}
              {exiting ? "Exiting sandbox…" : "Connect my PMS"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
