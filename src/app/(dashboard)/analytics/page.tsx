"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import {
  DollarSign,
  Trophy,
  Zap,
  CalendarClock,
  ChevronDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type SortingState,
  type ColumnDef,
} from "@tanstack/react-table";
import { usePageHeader } from "@/hooks/usePageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { AutoReplyAnalytics } from "@/components/features/analytics/AutoReplyAnalytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAnalyticsStats,
  useRevenueOverTime,
  useChannelBreakdown,
  useSequenceConversions,
  useFunnelData,
} from "@/hooks/useAnalytics";
import { type SequenceConversionRow } from "@/types/app.types";

// ─── Date Range ──────────────────────────────────────────────────────────────

type DateRange = 7 | 30 | 90;

const DATE_OPTIONS: { label: string; value: DateRange }[] = [
  { label: "Last 7d", value: 7 },
  { label: "Last 30d", value: 30 },
  { label: "Last 90d", value: 90 },
];

// ─── Chart colors ────────────────────────────────────────────────────────────

const CHANNEL_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--primary) / 0.7)",
  "hsl(var(--primary) / 0.45)",
  "hsl(var(--primary) / 0.25)",
];

const FUNNEL_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--primary) / 0.75)",
  "hsl(var(--primary) / 0.5)",
  "hsl(var(--primary) / 0.3)",
];

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  fontSize: "12px",
};

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [days, setDays] = useState<DateRange>(30);

  usePageHeader({
    title: "Analytics",
    actions: <DateRangePicker value={days} onChange={setDays} />,
  });

  const { data: stats, isLoading: statsLoading } = useAnalyticsStats(days);
  const { data: revenue, isLoading: revenueLoading } = useRevenueOverTime(days);
  const { data: channels, isLoading: channelsLoading } = useChannelBreakdown(days);
  const { data: conversions, isLoading: conversionsLoading } = useSequenceConversions(days);
  const { data: funnel, isLoading: funnelLoading } = useFunnelData(days);

  return (
    <div className="space-y-6">

      {/* Row 1 — Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue Recovered"
          value={
            statsLoading
              ? ""
              : `$${(stats?.revenue_recovered ?? 0).toLocaleString()}`
          }
          icon={DollarSign}
          trend="up"
          loading={statsLoading}
          index={0}
        />
        <StatCard
          title="Best Performing Sequence"
          value={
            statsLoading
              ? ""
              : stats?.best_sequence
              ? `${stats.best_sequence.conversion_rate.toFixed(1)}%`
              : "—"
          }
          change={
            stats?.best_sequence
              ? { value: stats.best_sequence.conversion_rate, period: stats.best_sequence.name }
              : undefined
          }
          icon={Trophy}
          trend="up"
          loading={statsLoading}
          index={1}
          className="[&_svg]:text-amber-500 [&_.rounded-lg]:bg-amber-500/10"
        />
        <StatCard
          title="Most Effective Channel"
          value={
            statsLoading
              ? ""
              : stats?.best_channel
              ? stats.best_channel.channel.toUpperCase()
              : "—"
          }
          change={
            stats?.best_channel
              ? {
                  value: stats.best_channel.conversion_rate,
                  period: "conversion",
                }
              : undefined
          }
          icon={Zap}
          trend="up"
          loading={statsLoading}
          index={2}
          className="[&_svg]:text-blue-500 [&_.rounded-lg]:bg-blue-500/10"
        />
        <StatCard
          title="Avg Days to Book"
          value={
            statsLoading
              ? ""
              : stats?.avg_days_to_book
              ? `${stats.avg_days_to_book.toFixed(1)} days`
              : "—"
          }
          icon={CalendarClock}
          trend="neutral"
          loading={statsLoading}
          index={3}
        />
      </div>

      {/* Row 2 — Charts */}
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Revenue Recovered</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : revenue && revenue.length > 0 ? (
              <RevenueRecoveredChart data={revenue} />
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No revenue data for this period.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Channel Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {channelsLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : channels && channels.length > 0 ? (
              <ChannelBreakdownChart data={channels} />
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No message data for this period.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 3 — AI Auto-Reply */}
      <AutoReplyAnalytics days={days} />

      {/* Row 4 — Table + Funnel */}
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Sequence Conversions</CardTitle>
          </CardHeader>
          <CardContent>
            {conversionsLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : conversions && conversions.length > 0 ? (
              <SequenceConversionTable data={conversions} />
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No sequence data for this period.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Conversion Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            {funnelLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : funnel && funnel.some((s) => s.value > 0) ? (
              <ConversionFunnelChart data={funnel} />
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No funnel data for this period.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Date Range Picker ───────────────────────────────────────────────────────

function DateRangePicker({
  value,
  onChange,
}: {
  value: DateRange;
  onChange: (v: DateRange) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(!open)}
        className="min-w-[120px] justify-between"
      >
        {DATE_OPTIONS.find((o) => o.value === value)?.label}
        <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
      </Button>
      {open && (
        <div className="absolute right-0 top-full z-10 mt-1 rounded-md border bg-card p-1 shadow-md">
          {DATE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`block w-full rounded-sm px-3 py-1.5 text-left text-sm transition-colors hover:bg-muted ${
                opt.value === value
                  ? "font-medium text-primary"
                  : "text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Dynamic Chart Components ────────────────────────────────────────────────

const ChartLoading = () => (
  <div className="h-[300px] animate-pulse rounded bg-muted" />
);

const RevenueRecoveredChart = dynamic(
  () => Promise.all([import("recharts"), import("date-fns")]).then(([mod, dateFns]) => {
    const { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } = mod;
    const { format } = dateFns;
    function Chart({ data }: { data: { date: string; amount: number }[] }) {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data} margin={{ left: 0, right: 12, top: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="amberGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              stroke="hsl(var(--muted-foreground))"
              tickFormatter={(v: string) => format(new Date(v), "M/d")}
            />
            <YAxis
              fontSize={12}
              tickLine={false}
              axisLine={false}
              stroke="hsl(var(--muted-foreground))"
              tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value) => [
                `$${Number(value).toLocaleString()}`,
                "Revenue",
              ]}
              labelFormatter={(label) => format(new Date(String(label)), "MMM d")}
            />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#amberGradient)"
              isAnimationActive
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      );
    }
    return Chart;
  }),
  { ssr: false, loading: ChartLoading }
);

const ChannelBreakdownChart = dynamic(
  () => import("recharts").then((mod) => {
    const { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } = mod;
    function Chart({ data }: { data: { channel: string; count: number }[] }) {
      const total = data.reduce((sum, d) => sum + d.count, 0);
      return (
        <div className="flex flex-col items-center gap-4">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                dataKey="count"
                nameKey="channel"
                paddingAngle={2}
                isAnimationActive
                animationDuration={800}
              >
                {data.map((_: unknown, i: number) => (
                  <Cell key={i} fill={CHANNEL_COLORS[i % CHANNEL_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value, name) => [
                  `${Number(value).toLocaleString()} (${((Number(value) / total) * 100).toFixed(1)}%)`,
                  String(name).toUpperCase(),
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
            {data.map((d, i) => (
              <div key={d.channel} className="flex items-center gap-1.5 text-xs">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: CHANNEL_COLORS[i % CHANNEL_COLORS.length] }}
                />
                <span className="capitalize text-muted-foreground">
                  {d.channel}
                </span>
                <span className="font-medium">{d.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return Chart;
  }),
  { ssr: false, loading: ChartLoading }
);

// ─── Sequence Conversion Table ───────────────────────────────────────────────

const columns: ColumnDef<SequenceConversionRow>[] = [
  {
    accessorKey: "name",
    header: "Sequence",
    cell: (info) => (
      <span className="font-medium">{info.getValue<string>()}</span>
    ),
  },
  {
    accessorKey: "sent",
    header: "Sent",
    cell: (info) => info.getValue<number>().toLocaleString(),
  },
  {
    accessorKey: "delivered",
    header: "Delivered",
    cell: (info) => info.getValue<number>().toLocaleString(),
  },
  {
    accessorKey: "replied",
    header: "Replied",
    cell: (info) => info.getValue<number>().toLocaleString(),
  },
  {
    accessorKey: "booked",
    header: "Booked",
    cell: (info) => info.getValue<number>().toLocaleString(),
  },
  {
    accessorKey: "conversion_rate",
    header: "Conv. Rate",
    cell: (info) => {
      const rate = info.getValue<number>();
      return (
        <span
          className={
            rate >= 35
              ? "text-emerald-600 dark:text-emerald-400 font-semibold"
              : rate >= 20
              ? "text-primary font-medium"
              : "text-muted-foreground"
          }
        >
          {rate.toFixed(1)}%
        </span>
      );
    },
  },
];

function SequenceConversionTable({ data }: { data: SequenceConversionRow[] }) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id} className="border-b">
              {hg.headers.map((header) => (
                <th
                  key={header.id}
                  className="pb-2 pr-4 text-left font-medium text-muted-foreground cursor-pointer select-none"
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <div className="flex items-center gap-1">
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                    {header.column.getIsSorted() === "asc" ? (
                      <ArrowUp className="h-3 w-3" />
                    ) : header.column.getIsSorted() === "desc" ? (
                      <ArrowDown className="h-3 w-3" />
                    ) : (
                      <ArrowUpDown className="h-3 w-3 opacity-30" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border-b last:border-0">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="py-2.5 pr-4">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Funnel Chart ────────────────────────────────────────────────────────────

const ConversionFunnelChart = dynamic(
  () => import("recharts").then((mod) => {
    const { FunnelChart, Funnel, Cell, LabelList, ResponsiveContainer, Tooltip } = mod;
    function Chart({ data }: { data: { stage: string; value: number }[] }) {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <FunnelChart>
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value, name) => [
                Number(value).toLocaleString(),
                String(name),
              ]}
            />
            <Funnel
              dataKey="value"
              nameKey="stage"
              data={data}
              isAnimationActive
              animationDuration={800}
            >
              {data.map((_: unknown, i: number) => (
                <Cell key={i} fill={FUNNEL_COLORS[i % FUNNEL_COLORS.length]} />
              ))}
              <LabelList
                dataKey="stage"
                position="right"
                fontSize={12}
                fill="hsl(var(--foreground))"
              />
            </Funnel>
          </FunnelChart>
        </ResponsiveContainer>
      );
    }
    return Chart;
  }),
  { ssr: false, loading: ChartLoading }
);
