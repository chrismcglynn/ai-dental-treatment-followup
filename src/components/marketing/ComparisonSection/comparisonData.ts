export type IndicatorType = "full" | "partial" | "none" | "na";

export interface FeatureIndicator {
  type: IndicatorType;
  label?: string;
}

export interface ComparisonFeature {
  id: string;
  label: string;
  description?: string;
  highlighted?: boolean;
}

export interface Competitor {
  id: string;
  name: string;
  descriptor: string;
  isRetaine?: boolean;
}

export const COMPETITORS: Competitor[] = [
  {
    id: "retaine",
    name: "Retaine",
    descriptor: "Treatment plan recovery engine",
    isRetaine: true,
  },
  {
    id: "weave",
    name: "Weave",
    descriptor: "General communication platform",
  },
  {
    id: "revenuewell",
    name: "RevenueWell",
    descriptor: "Dental marketing & recalls",
  },
  {
    id: "pms",
    name: "Built-in PMS",
    descriptor: "Dentrix / Eaglesoft / Open Dental",
  },
  {
    id: "manual",
    name: "Manual",
    descriptor: "Spreadsheets & phone calls",
  },
];

export const COMPARISON_MATRIX: {
  feature: ComparisonFeature;
  indicators: Record<string, FeatureIndicator>;
}[] = [
  {
    feature: {
      id: "auto-sequences",
      label: "Automated multi-step follow-up sequences",
      description:
        "Multi-channel sequences that run automatically without staff intervention",
    },
    indicators: {
      retaine: { type: "full" },
      weave: { type: "partial", label: "Manual list" },
      revenuewell: { type: "none" },
      pms: { type: "none" },
      manual: { type: "none" },
    },
  },
  {
    feature: {
      id: "multi-channel",
      label: "SMS + Email + Voicemail in one sequence",
      description:
        "Reach patients across all channels in a single automated sequence",
    },
    indicators: {
      retaine: { type: "full" },
      weave: { type: "partial", label: "SMS + email only" },
      revenuewell: { type: "partial", label: "Email only" },
      pms: { type: "none" },
      manual: { type: "none" },
    },
  },
  {
    feature: {
      id: "auto-detect",
      label: "Detects unscheduled plans automatically",
      description:
        "Syncs with your PMS to find patients who left without scheduling",
    },
    indicators: {
      retaine: { type: "full" },
      weave: { type: "none" },
      revenuewell: { type: "none" },
      pms: { type: "partial", label: "Recalls only" },
      manual: { type: "none" },
    },
  },
  {
    feature: {
      id: "ai-draft",
      label: "AI-drafted replies & intent classification",
      description:
        "AI reads patient replies, classifies intent, and drafts context-aware responses for your team",
    },
    indicators: {
      retaine: { type: "full" },
      weave: { type: "none" },
      revenuewell: { type: "none" },
      pms: { type: "none" },
      manual: { type: "none" },
    },
  },
  {
    feature: {
      id: "ai-sequences",
      label: "AI-generated sequences & smart matching",
      description:
        "AI builds follow-up sequences for any procedure and matches existing sequences to new treatment plans",
    },
    indicators: {
      retaine: { type: "full" },
      weave: { type: "none" },
      revenuewell: { type: "none" },
      pms: { type: "none" },
      manual: { type: "none" },
    },
  },
  {
    feature: {
      id: "revenue-dashboard",
      label: "Revenue recovered dashboard",
      description:
        "See exactly how much revenue each sequence is recovering in real time",
      highlighted: true,
    },
    indicators: {
      retaine: { type: "full" },
      weave: { type: "none" },
      revenuewell: { type: "none" },
      pms: { type: "none" },
      manual: { type: "none" },
    },
  },
  {
    feature: {
      id: "zero-staff",
      label: "Zero front desk action required",
      description:
        "From detection to follow-up to booking — no staff involvement needed",
      highlighted: true,
    },
    indicators: {
      retaine: { type: "full" },
      weave: { type: "none" },
      revenuewell: { type: "none" },
      pms: { type: "none" },
      manual: { type: "none" },
    },
  },
  {
    feature: {
      id: "analytics",
      label: "Per-sequence conversion analytics",
      description:
        "Track conversion rates by sequence, channel, and procedure type",
    },
    indicators: {
      retaine: { type: "full" },
      weave: { type: "none" },
      revenuewell: { type: "partial", label: "Campaign-level" },
      pms: { type: "none" },
      manual: { type: "none" },
    },
  },
  {
    feature: {
      id: "pms-sync",
      label: "Open Dental / Dentrix / Eaglesoft sync",
      description: "Direct integration with your practice management system",
    },
    indicators: {
      retaine: { type: "full" },
      weave: { type: "full" },
      revenuewell: { type: "partial" },
      pms: { type: "full", label: "Native" },
      manual: { type: "none" },
    },
  },
  {
    feature: {
      id: "hipaa",
      label: "HIPAA-compliant messaging",
      description: "All patient communication meets HIPAA security requirements",
    },
    indicators: {
      retaine: { type: "full" },
      weave: { type: "full" },
      revenuewell: { type: "full" },
      pms: { type: "full" },
      manual: { type: "na" },
    },
  },
  {
    feature: {
      id: "setup",
      label: "Setup time",
      description: "Time from signup to first automated sequence running",
    },
    indicators: {
      retaine: { type: "full", label: "< 10 min" },
      weave: { type: "partial", label: "Days" },
      revenuewell: { type: "partial", label: "Days" },
      pms: { type: "none", label: "Weeks" },
      manual: { type: "na", label: "—" },
    },
  },
];
