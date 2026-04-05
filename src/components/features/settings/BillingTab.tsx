"use client";

import { useState } from "react";
import {
  CreditCard,
  ExternalLink,
  AlertTriangle,
  Check,
  Zap,
  Users,
  MessageSquare,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { usePracticeStore } from "@/stores/practice-store";
import { useUsageStats } from "@/hooks/useSettings";

const PLAN_FEATURES = [
  "Unlimited patients",
  "Unlimited active sequences",
  "AI-powered personalization",
  "SMS, Email, & Voicemail channels",
  "Priority support",
  "Advanced analytics",
];

const DEMO_INVOICES = [
  { id: "inv_001", date: "Mar 1, 2026", amount: "$299.00", status: "paid" },
  { id: "inv_002", date: "Feb 1, 2026", amount: "$299.00", status: "paid" },
  { id: "inv_003", date: "Jan 1, 2026", amount: "$299.00", status: "paid" },
];

export function BillingTab() {
  const practice = usePracticeStore((s) => s.activePractice);
  const { data: usage } = useUsageStats();
  const [cancelOpen, setCancelOpen] = useState(false);

  const status = practice?.subscription_status ?? "trialing";
  const isTrial = status === "trialing";
  const isActive = status === "active";

  const statusLabel: Record<string, { text: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    trialing: { text: "Trial", variant: "secondary" },
    active: { text: "Active", variant: "default" },
    past_due: { text: "Past Due", variant: "destructive" },
    canceled: { text: "Canceled", variant: "outline" },
    free: { text: "Free", variant: "outline" },
  };

  const badge = statusLabel[status] ?? statusLabel.free;

  const handleUpgrade = async () => {
    // In production, this calls /api/billing/checkout to create a Stripe Checkout session
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ practiceId: practice?.id }),
    });
    const { url } = await res.json();
    if (url) window.location.href = url;
  };

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Current Plan</CardTitle>
            <Badge variant={badge.variant}>{badge.text}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-2xl font-semibold">
              $299
              <span className="text-sm font-normal text-muted-foreground">
                /month
              </span>
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {isTrial
                ? "Pro plan — 14 days remaining in trial"
                : isActive
                  ? "Pro plan — renews monthly"
                  : `Pro plan — ${status.replace("_", " ")}`}
            </p>
          </div>
          <Separator />
          <ul className="grid gap-2 sm:grid-cols-2">
            {PLAN_FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-primary shrink-0" />
                {feature}
              </li>
            ))}
          </ul>

          {(isTrial || status === "canceled" || status === "free") && (
            <Button onClick={handleUpgrade}>
              Upgrade to Pro
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Usage Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Usage This Month</CardTitle>
          <CardDescription>
            Current billing period usage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-muted p-2">
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-lg font-semibold">
                  {usage?.patientsInSequences ?? 0}
                </p>
                <p className="text-xs text-muted-foreground">
                  Patients in sequences
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-muted p-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-lg font-semibold">
                  {usage?.messagesSentThisMonth ?? 0}
                </p>
                <p className="text-xs text-muted-foreground">
                  Messages sent
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-muted p-2">
                <Zap className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-lg font-semibold">Unlimited</p>
                <p className="text-xs text-muted-foreground">
                  Active sequences
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Invoice History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-2 text-left font-medium">Date</th>
                  <th className="px-4 py-2 text-left font-medium">Amount</th>
                  <th className="px-4 py-2 text-left font-medium">Status</th>
                  <th className="px-4 py-2 text-right font-medium">Invoice</th>
                </tr>
              </thead>
              <tbody>
                {DEMO_INVOICES.map((inv) => (
                  <tr key={inv.id} className="border-b last:border-0">
                    <td className="px-4 py-3">{inv.date}</td>
                    <td className="px-4 py-3">{inv.amount}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="text-xs capitalize">
                        {inv.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" className="h-7 text-xs">
                        Download
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment Method</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-muted p-2">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                No payment method on file
              </p>
            </div>
          </div>
          <Button variant="outline" className="mt-4" size="sm">
            Add Payment Method
          </Button>
        </CardContent>
      </Card>

      {/* Cancel Subscription */}
      {(isActive || isTrial) && (
        <Card className="border-destructive/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <div>
                  <p className="text-sm font-medium">Cancel Subscription</p>
                  <p className="text-xs text-muted-foreground">
                    Your data will be preserved but sequences will stop
                  </p>
                </div>
              </div>
              <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-destructive">
                    Cancel Plan
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Cancel Subscription</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to cancel? Here&apos;s what you&apos;ll
                      lose:
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 py-4">
                    <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-4">
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                          <span>
                            <strong>{usage?.patientsInSequences ?? 0}</strong>{" "}
                            active patient sequences will stop
                          </span>
                        </li>
                        <li className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                          All scheduled messages will be canceled
                        </li>
                        <li className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                          AI personalization will be disabled
                        </li>
                      </ul>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Your patient data and sequence templates will be preserved.
                      You can reactivate at any time.
                    </p>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setCancelOpen(false)}
                    >
                      Keep My Plan
                    </Button>
                    <Button variant="destructive">Confirm Cancellation</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
