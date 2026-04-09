"use client";

import { Bot, ArrowUpRight, Clock, AlertTriangle } from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAutoReplyStats } from "@/hooks/useAnalytics";

const ESCALATION_COLORS: Record<string, string> = {
  "Patient mentioned clinical concern": "bg-red-500",
  "Patient asking about cost/insurance": "bg-amber-500",
  "Patient asking about specific availability": "bg-blue-500",
  "Low confidence on intent classification": "bg-purple-500",
  "Maximum auto-replies reached": "bg-slate-500",
  "Wrong number reported": "bg-orange-500",
};

export function AutoReplyAnalytics({ days }: { days: number }) {
  const { data: stats, isLoading } = useAutoReplyStats(days);

  if (!stats && !isLoading) return null;

  const totalConversations = (stats?.autoReplied ?? 0) + (stats?.escalated ?? 0) + (stats?.manual ?? 0);
  const autoReplyRate = totalConversations > 0
    ? ((stats?.autoReplied ?? 0) / totalConversations * 100)
    : 0;
  const escalationRate = totalConversations > 0
    ? ((stats?.escalated ?? 0) / totalConversations * 100)
    : 0;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
        <Bot className="h-4 w-4" />
        AI Auto-Reply Performance
      </h3>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Auto-Reply Rate"
          value={isLoading ? "" : `${autoReplyRate.toFixed(1)}%`}
          icon={Bot}
          trend="up"
          loading={isLoading}
          index={0}
          className="[&_svg]:text-blue-500 [&_.rounded-lg]:bg-blue-500/10"
        />
        <StatCard
          title="AI Conversion Rate"
          value={isLoading ? "" : `${(stats?.aiConversionRate ?? 0).toFixed(1)}%`}
          change={stats ? { value: stats.manualConversionRate, period: "manual" } : undefined}
          icon={ArrowUpRight}
          trend="neutral"
          loading={isLoading}
          index={1}
        />
        <StatCard
          title="Avg AI Response Time"
          value={isLoading ? "" : `${stats?.avgResponseTimeSec ?? 30}s`}
          icon={Clock}
          trend="neutral"
          loading={isLoading}
          index={2}
        />
        <StatCard
          title="Escalation Rate"
          value={isLoading ? "" : `${escalationRate.toFixed(1)}%`}
          icon={AlertTriangle}
          trend="neutral"
          loading={isLoading}
          index={3}
          className="[&_svg]:text-amber-500 [&_.rounded-lg]:bg-amber-500/10"
        />
      </div>

      {/* Escalation Reasons Breakdown */}
      {stats?.escalationReasons && stats.escalationReasons.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Escalation Reasons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.escalationReasons.map((reason) => {
                const pct = stats.escalated > 0
                  ? (reason.count / stats.escalated * 100)
                  : 0;
                return (
                  <div key={reason.reason} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{reason.reason}</span>
                      <span className="font-medium">{reason.count} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${ESCALATION_COLORS[reason.reason] ?? "bg-primary"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
