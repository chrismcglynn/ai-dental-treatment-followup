"use client";

import { motion } from "framer-motion";
import { type LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: { value: number; period: string };
  icon?: LucideIcon;
  trend?: "up" | "down" | "neutral";
  loading?: boolean;
  onClick?: () => void;
  index?: number;
  className?: string;
}

export function StatCard({
  title,
  value,
  change,
  icon: Icon,
  trend = "neutral",
  loading = false,
  onClick,
  index = 0,
  className,
}: StatCardProps) {
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.1, ease: "easeOut" }}
      >
        <Card className={cn("relative overflow-hidden", className)}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-3 flex-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="h-10 w-10 rounded-lg" />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  const trendColor =
    trend === "up"
      ? "text-emerald-600 dark:text-emerald-400"
      : trend === "down"
      ? "text-red-600 dark:text-red-400"
      : "text-muted-foreground";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1, ease: "easeOut" }}
      whileHover={{ y: -2 }}
    >
      <Card
        className={cn(
          "relative overflow-hidden transition-shadow",
          onClick && "cursor-pointer hover:shadow-md",
          className
        )}
        onClick={onClick}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                {title}
              </p>
              <p className="text-3xl font-semibold tracking-tight">{value}</p>
              {change && (
                <div className={cn("flex items-center gap-1 text-xs font-medium", trendColor)}>
                  <TrendIcon className="h-3 w-3" />
                  <span>
                    {change.value > 0 ? "+" : ""}
                    {change.value}% {change.period}
                  </span>
                </div>
              )}
            </div>
            {Icon && (
              <div className="rounded-lg bg-primary/10 p-2.5">
                <Icon className="h-5 w-5 text-primary" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
