"use client";

import { useRouter } from "next/navigation";
import {
  DollarSign,
  ListChecks,
  MessageSquare,
  TrendingUp,
  Mail,
  Phone,
  MessageCircle,
  ArrowRight,
} from "lucide-react";
import dynamic from "next/dynamic";

const RechartsBarChart = dynamic(
  () => import("recharts").then((mod) => {
    const { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } = mod;
    // Wrap in a component for dynamic import
    function DashboardChart({ data }: { data: Array<{ name: string; conversion_rate: number }> }) {
      return (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ left: 0, right: 12, top: 0, bottom: 0 }}
          >
            <XAxis
              type="number"
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
              fontSize={12}
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis
              type="category"
              dataKey="name"
              width={100}
              fontSize={12}
              tickLine={false}
              axisLine={false}
              stroke="hsl(var(--muted-foreground))"
            />
            <Tooltip
              formatter={(value) => [`${Number(value).toFixed(1)}%`, "Conversion"]}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
            <Bar
              dataKey="conversion_rate"
              radius={[0, 4, 4, 0]}
              animationDuration={800}
            >
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={
                    entry.conversion_rate >= 35
                      ? "hsl(var(--primary))"
                      : entry.conversion_rate >= 25
                      ? "hsl(var(--primary) / 0.7)"
                      : "hsl(var(--muted-foreground) / 0.4)"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      );
    }
    return DashboardChart;
  }),
  { ssr: false, loading: () => <div className="h-[280px] animate-pulse rounded bg-muted" /> }
);
import { motion } from "framer-motion";
import { usePageHeader } from "@/hooks/usePageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import {
  useDashboardStats,
  useRecentActivity,
  useSequencePerformance,
} from "@/hooks/useAnalytics";
import { usePendingTreatmentsWithPatients } from "@/hooks/usePatients";

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: recentActivity, isLoading: activityLoading } =
    useRecentActivity();
  const { data: sequencePerf, isLoading: perfLoading } =
    useSequencePerformance();
  const { data: pendingRows } = usePendingTreatmentsWithPatients();
  const pendingCount = pendingRows?.length ?? 0;
  const pendingRevenue = pendingRows?.reduce(
    (sum, r) => sum + (r.treatment.amount ?? 0),
    0
  ) ?? 0;

  const conversionRate = stats?.conversion_rate ?? 0;

  usePageHeader({ title: "Dashboard" });

  return (
    <div className="space-y-6">

      {/* Pending Treatments — revenue opportunity */}
      {pendingCount > 0 && (
        <PendingRevenueCard
          count={pendingCount}
          revenue={pendingRevenue}
        />
      )}

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Revenue Recovered"
          value={
            statsLoading
              ? ""
              : `$${(stats?.revenue_recovered ?? 0).toLocaleString()}`
          }
          change={
            stats
              ? { value: stats.revenue_change, period: "vs last month" }
              : undefined
          }
          icon={DollarSign}
          trend="up"
          loading={statsLoading}
          index={0}
        />
        <StatCard
          title="Plans in Sequence"
          value={statsLoading ? "" : stats?.plans_in_sequence ?? 0}
          icon={ListChecks}
          trend="neutral"
          loading={statsLoading}
          index={1}
          className="[&_svg]:text-blue-500 [&_.rounded-lg]:bg-blue-500/10"
        />
        <StatCard
          title="Conversion Rate"
          value={statsLoading ? "" : `${conversionRate.toFixed(1)}%`}
          change={
            stats
              ? { value: stats.conversion_change, period: "vs last month" }
              : undefined
          }
          icon={TrendingUp}
          trend={conversionRate > 30 ? "up" : "neutral"}
          loading={statsLoading}
          index={2}
          className={
            conversionRate > 30
              ? "[&_svg]:text-emerald-500 [&_.rounded-lg]:bg-emerald-500/10"
              : ""
          }
        />
        <StatCard
          title="Messages Sent (30d)"
          value={
            statsLoading
              ? ""
              : (stats?.messages_sent ?? 0).toLocaleString()
          }
          icon={MessageSquare}
          trend="neutral"
          loading={statsLoading}
          index={3}
        />
      </div>

      {/* Activity + Performance */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Recent Activity — 60% */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 py-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                ))}
              </div>
            ) : recentActivity && recentActivity.length > 0 ? (
              <div className="space-y-1">
                {recentActivity.map((item) => (
                  <RecentActivityRow key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No recent activity yet. Start a sequence to see messages here.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Sequence Performance — 40% */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Sequence Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {perfLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : sequencePerf && sequencePerf.length > 0 ? (
              <RechartsBarChart data={sequencePerf} />
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No active sequences yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function RecentActivityRow({
  item,
}: {
  item: {
    id: string;
    patient_name: string;
    channel: "sms" | "email" | "voicemail";
    status: string;
    created_at: string;
  };
}) {
  const ChannelIcon =
    item.channel === "email"
      ? Mail
      : item.channel === "sms"
      ? MessageCircle
      : Phone;

  const statusVariant =
    item.status === "delivered"
      ? "default"
      : item.status === "sent"
      ? "secondary"
      : item.status === "failed"
      ? "destructive"
      : "outline";

  return (
    <div className="flex items-center gap-3 py-2.5 border-b last:border-0">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
        <ChannelIcon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.patient_name}</p>
        <p className="text-xs text-muted-foreground capitalize">
          {item.channel} message
        </p>
      </div>
      <Badge variant={statusVariant} className="text-[10px] capitalize">
        {item.status}
      </Badge>
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {formatTimeAgo(item.created_at)}
      </span>
    </div>
  );
}

function PendingRevenueCard({ count, revenue }: { count: number; revenue: number }) {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-primary/30 bg-primary/5 dark:bg-primary/10">
        <CardContent className="flex items-center gap-5 py-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 dark:bg-primary/20">
            <DollarSign className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-bold text-foreground">
              ${revenue.toLocaleString()} waiting to be recovered
            </p>
            <p className="text-sm text-muted-foreground">
              {count} accepted treatment plan{count !== 1 ? "s" : ""} not yet in
              a follow-up sequence
            </p>
          </div>
          <Button
            size="sm"
            className="shrink-0"
            onClick={() => router.push("/treatments/pending")}
          >
            Review &amp; enroll
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return format(new Date(dateStr), "MMM d, yyyy");
}
