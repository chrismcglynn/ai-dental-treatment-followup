import { useQuery } from "@tanstack/react-query";
import {
  getDashboardStats,
  getRevenueOverTime,
  getRecentActivity,
  getSequencePerformance,
  getPendingTreatmentsCount,
  getAnalyticsStats,
  getAutoReplyStats,
  getChannelBreakdown,
  getSequenceConversions,
  getFunnelData,
  type RecentActivityItem,
  type SequencePerformanceItem,
} from "@/lib/api/analytics";
import {
  type DashboardStats,
  type AnalyticsStats,
  type ChannelBreakdownItem,
  type SequenceConversionRow,
  type FunnelStageItem,
  type AutoReplyStats,
} from "@/types/app.types";
import { usePracticeStore } from "@/stores/practice-store";
import { useSandbox } from "@/lib/sandbox";
import { simulateDelay } from "@/lib/sandbox/utils";

// Query keys factory
export const analyticsKeys = {
  all: (practiceId: string) => ["analytics", practiceId] as const,
  dashboard: (practiceId: string) =>
    [...analyticsKeys.all(practiceId), "dashboard"] as const,
  revenue: (practiceId: string, days: number) =>
    [...analyticsKeys.all(practiceId), "revenue", days] as const,
  recentActivity: (practiceId: string) =>
    [...analyticsKeys.all(practiceId), "recent-activity"] as const,
  sequencePerformance: (practiceId: string) =>
    [...analyticsKeys.all(practiceId), "sequence-performance"] as const,
  pendingTreatments: (practiceId: string) =>
    [...analyticsKeys.all(practiceId), "pending-treatments"] as const,
  analyticsStats: (practiceId: string, days: number) =>
    [...analyticsKeys.all(practiceId), "analytics-stats", days] as const,
  channelBreakdown: (practiceId: string, days: number) =>
    [...analyticsKeys.all(practiceId), "channel-breakdown", days] as const,
  sequenceConversions: (practiceId: string, days: number) =>
    [...analyticsKeys.all(practiceId), "sequence-conversions", days] as const,
  funnel: (practiceId: string, days: number) =>
    [...analyticsKeys.all(practiceId), "funnel", days] as const,
  autoReply: (practiceId: string, days: number) =>
    [...analyticsKeys.all(practiceId), "auto-reply", days] as const,
};

export function useDashboardStats() {
  const activePracticeId = usePracticeStore((s) => s.activePracticeId);
  const { isSandbox, sandboxStore } = useSandbox();

  return useQuery({
    queryKey: analyticsKeys.dashboard(activePracticeId!),
    queryFn: async (): Promise<DashboardStats> => {
      if (isSandbox) {
        await simulateDelay(300);
        return sandboxStore.getDashboardStats() as DashboardStats;
      }
      return getDashboardStats(activePracticeId!);
    },
    enabled: !!activePracticeId,
    refetchInterval: 1000 * 60 * 5,
  });
}

export function useRevenueOverTime(days = 30) {
  const activePracticeId = usePracticeStore((s) => s.activePracticeId);
  const { isSandbox, sandboxStore } = useSandbox();

  return useQuery({
    queryKey: analyticsKeys.revenue(activePracticeId!, days),
    queryFn: async (): Promise<{ date: string; amount: number }[]> => {
      if (isSandbox) {
        await simulateDelay(200);
        return sandboxStore.getRevenueOverTime(days) as { date: string; amount: number }[];
      }
      return getRevenueOverTime(activePracticeId!, days);
    },
    enabled: !!activePracticeId,
  });
}

export function useRecentActivity() {
  const activePracticeId = usePracticeStore((s) => s.activePracticeId);
  const { isSandbox, sandboxStore } = useSandbox();

  return useQuery({
    queryKey: analyticsKeys.recentActivity(activePracticeId!),
    queryFn: async (): Promise<RecentActivityItem[]> => {
      if (isSandbox) {
        await simulateDelay(200);
        return sandboxStore.getRecentActivity() as RecentActivityItem[];
      }
      return getRecentActivity(activePracticeId!);
    },
    enabled: !!activePracticeId,
    refetchInterval: 1000 * 30,
  });
}

export function useSequencePerformance() {
  const activePracticeId = usePracticeStore((s) => s.activePracticeId);
  const { isSandbox, sandboxStore } = useSandbox();

  return useQuery({
    queryKey: analyticsKeys.sequencePerformance(activePracticeId!),
    queryFn: async (): Promise<SequencePerformanceItem[]> => {
      if (isSandbox) {
        await simulateDelay(200);
        return sandboxStore.getSequencePerformance() as SequencePerformanceItem[];
      }
      return getSequencePerformance(activePracticeId!);
    },
    enabled: !!activePracticeId,
  });
}

export function usePendingTreatments() {
  const activePracticeId = usePracticeStore((s) => s.activePracticeId);
  const { isSandbox, sandboxStore } = useSandbox();

  return useQuery({
    queryKey: analyticsKeys.pendingTreatments(activePracticeId!),
    queryFn: async (): Promise<number> => {
      if (isSandbox) {
        await simulateDelay(200);
        return sandboxStore.getPendingTreatmentsCount() as number;
      }
      return getPendingTreatmentsCount(activePracticeId!);
    },
    enabled: !!activePracticeId,
    refetchInterval: 1000 * 60 * 5,
  });
}

export function useAnalyticsStats(days = 30) {
  const activePracticeId = usePracticeStore((s) => s.activePracticeId);
  const { isSandbox, sandboxStore } = useSandbox();

  return useQuery({
    queryKey: analyticsKeys.analyticsStats(activePracticeId!, days),
    queryFn: async (): Promise<AnalyticsStats> => {
      if (isSandbox) {
        await simulateDelay(300);
        return sandboxStore.getAnalyticsStats() as AnalyticsStats;
      }
      return getAnalyticsStats(activePracticeId!, days);
    },
    enabled: !!activePracticeId,
  });
}

export function useChannelBreakdown(days = 30) {
  const activePracticeId = usePracticeStore((s) => s.activePracticeId);
  const { isSandbox, sandboxStore } = useSandbox();

  return useQuery({
    queryKey: analyticsKeys.channelBreakdown(activePracticeId!, days),
    queryFn: async (): Promise<ChannelBreakdownItem[]> => {
      if (isSandbox) {
        await simulateDelay(200);
        return sandboxStore.getChannelBreakdown() as ChannelBreakdownItem[];
      }
      return getChannelBreakdown(activePracticeId!, days);
    },
    enabled: !!activePracticeId,
  });
}

export function useSequenceConversions(days = 30) {
  const activePracticeId = usePracticeStore((s) => s.activePracticeId);
  const { isSandbox, sandboxStore } = useSandbox();

  return useQuery({
    queryKey: analyticsKeys.sequenceConversions(activePracticeId!, days),
    queryFn: async (): Promise<SequenceConversionRow[]> => {
      if (isSandbox) {
        await simulateDelay(200);
        return sandboxStore.getSequenceConversions() as SequenceConversionRow[];
      }
      return getSequenceConversions(activePracticeId!, days);
    },
    enabled: !!activePracticeId,
  });
}

export function useFunnelData(days = 30) {
  const activePracticeId = usePracticeStore((s) => s.activePracticeId);
  const { isSandbox, sandboxStore } = useSandbox();

  return useQuery({
    queryKey: analyticsKeys.funnel(activePracticeId!, days),
    queryFn: async (): Promise<FunnelStageItem[]> => {
      if (isSandbox) {
        await simulateDelay(200);
        return sandboxStore.getFunnelData() as FunnelStageItem[];
      }
      return getFunnelData(activePracticeId!, days);
    },
    enabled: !!activePracticeId,
  });
}

export function useAutoReplyStats(days = 30) {
  const activePracticeId = usePracticeStore((s) => s.activePracticeId);
  const { isSandbox, sandboxStore } = useSandbox();

  return useQuery({
    queryKey: analyticsKeys.autoReply(activePracticeId!, days),
    queryFn: async (): Promise<AutoReplyStats> => {
      if (isSandbox) {
        await simulateDelay(300);
        return sandboxStore.getAutoReplyStats() as AutoReplyStats;
      }
      return getAutoReplyStats(activePracticeId!, days);
    },
    enabled: !!activePracticeId,
  });
}
