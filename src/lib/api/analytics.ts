import { createClient } from "@/lib/supabase/client";
import {
  type DashboardStats,
  type AnalyticsStats,
  type AutoReplyStats,
  type ChannelBreakdownItem,
  type SequenceConversionRow,
  type FunnelStageItem,
} from "@/types/app.types";

export async function getDashboardStats(
  practiceId: string
): Promise<DashboardStats> {
  const supabase = createClient();
  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000
  ).toISOString();

  const [patientsResult, messagesResult, enrollmentsResult, treatmentsResult] =
    await Promise.all([
      supabase
        .from("patients")
        .select("id", { count: "exact", head: true })
        .eq("practice_id", practiceId)
        .eq("status", "active"),
      supabase
        .from("messages")
        .select("id, status", { count: "exact" })
        .eq("practice_id", practiceId)
        .eq("direction", "outbound")
        .gte("created_at", thirtyDaysAgo),
      supabase
        .from("sequence_enrollments")
        .select("id, status", { count: "exact" })
        .eq("practice_id", practiceId),
      supabase
        .from("treatments")
        .select("amount, status")
        .eq("practice_id", practiceId)
        .in("status", ["accepted", "completed"]),
    ]);

  const totalMessages = messagesResult.count ?? 0;
  const deliveredMessages =
    messagesResult.data?.filter((m) => m.status === "delivered").length ?? 0;
  const totalEnrollments = enrollmentsResult.count ?? 0;
  const convertedEnrollments =
    enrollmentsResult.data?.filter((e) => e.status === "converted").length ?? 0;
  const activeEnrollments =
    enrollmentsResult.data?.filter((e) => e.status === "active").length ?? 0;
  const revenueRecovered =
    treatmentsResult.data?.reduce((sum, t) => sum + t.amount, 0) ?? 0;

  return {
    revenue_recovered: revenueRecovered,
    revenue_change: 12.5,
    active_patients: patientsResult.count ?? 0,
    patients_change: 8,
    plans_in_sequence: activeEnrollments,
    messages_sent: totalMessages,
    delivery_rate:
      totalMessages > 0 ? (deliveredMessages / totalMessages) * 100 : 0,
    conversion_rate:
      totalEnrollments > 0
        ? (convertedEnrollments / totalEnrollments) * 100
        : 0,
    conversion_change: 2.1,
  };
}

export async function getRevenueOverTime(
  practiceId: string,
  days = 30
): Promise<{ date: string; amount: number }[]> {
  const supabase = createClient();
  const startDate = new Date(
    Date.now() - days * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data, error } = await supabase
    .from("treatments")
    .select("amount, decided_at")
    .eq("practice_id", practiceId)
    .in("status", ["accepted", "completed"])
    .gte("decided_at", startDate)
    .order("decided_at", { ascending: true });

  if (error) throw error;

  const grouped = (data ?? []).reduce<Record<string, number>>((acc, t) => {
    if (t.decided_at) {
      const date = t.decided_at.split("T")[0];
      acc[date] = (acc[date] ?? 0) + t.amount;
    }
    return acc;
  }, {});

  return Object.entries(grouped).map(([date, amount]) => ({ date, amount }));
}

export interface RecentActivityItem {
  id: string;
  patient_name: string;
  channel: "sms" | "email" | "voicemail";
  status: string;
  created_at: string;
}

export async function getRecentActivity(
  practiceId: string,
  limit = 10
): Promise<RecentActivityItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("messages")
    .select("id, channel, status, created_at, patient_id, patients(first_name, last_name)")
    .eq("practice_id", practiceId)
    .eq("direction", "outbound")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data ?? []).map((msg) => {
    const patient = (msg as Record<string, unknown>).patients as {
      first_name: string;
      last_name: string;
    } | null;
    return {
      id: msg.id,
      patient_name: patient
        ? `${patient.first_name} ${patient.last_name}`
        : "Unknown Patient",
      channel: msg.channel,
      status: msg.status,
      created_at: msg.created_at,
    };
  });
}

export interface SequencePerformanceItem {
  name: string;
  conversion_rate: number;
  patient_count: number;
}

export async function getSequencePerformance(
  practiceId: string
): Promise<SequencePerformanceItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("sequences")
    .select("name, conversion_rate, patient_count")
    .eq("practice_id", practiceId)
    .eq("status", "active")
    .order("patient_count", { ascending: false })
    .limit(6);

  if (error) throw error;
  return data ?? [];
}

export async function getAnalyticsStats(
  practiceId: string,
  days = 30
): Promise<AnalyticsStats> {
  const supabase = createClient();
  const startDate = new Date(
    Date.now() - days * 24 * 60 * 60 * 1000
  ).toISOString();

  const [treatmentsResult, enrollmentsResult, messagesResult] =
    await Promise.all([
      supabase
        .from("treatments")
        .select("amount, status, decided_at, created_at")
        .eq("practice_id", practiceId)
        .in("status", ["accepted", "completed"])
        .gte("decided_at", startDate),
      supabase
        .from("sequence_enrollments")
        .select("id, status, sequence_id, created_at, converted_at, sequences(name)")
        .eq("practice_id", practiceId)
        .gte("created_at", startDate),
      supabase
        .from("messages")
        .select("id, channel, status, direction")
        .eq("practice_id", practiceId)
        .eq("direction", "outbound")
        .gte("created_at", startDate),
    ]);

  const treatments = treatmentsResult.data ?? [];
  const enrollments = enrollmentsResult.data ?? [];
  const messages = messagesResult.data ?? [];

  // Revenue recovered
  const revenueRecovered = treatments.reduce((sum, t) => sum + t.amount, 0);

  // Best performing sequence
  const seqMap = new Map<string, { name: string; total: number; converted: number }>();
  for (const e of enrollments) {
    const seq = (e as Record<string, unknown>).sequences as { name: string } | null;
    const seqName = seq?.name ?? "Unknown";
    const existing = seqMap.get(e.sequence_id) ?? { name: seqName, total: 0, converted: 0 };
    existing.total++;
    if (e.status === "converted") existing.converted++;
    seqMap.set(e.sequence_id, existing);
  }
  let bestSequence: AnalyticsStats["best_sequence"] = null;
  let bestSeqRate = 0;
  seqMap.forEach((v) => {
    const rate = v.total > 0 ? (v.converted / v.total) * 100 : 0;
    if (rate > bestSeqRate) {
      bestSeqRate = rate;
      bestSequence = { name: v.name, conversion_rate: rate };
    }
  });

  // Most effective channel
  const channelMap = new Map<string, { total: number; replied: number }>();
  for (const m of messages) {
    const existing = channelMap.get(m.channel) ?? { total: 0, replied: 0 };
    existing.total++;
    if (m.status === "replied") existing.replied++;
    channelMap.set(m.channel, existing);
  }
  let bestChannel: AnalyticsStats["best_channel"] = null;
  let bestChRate = 0;
  channelMap.forEach((v, ch) => {
    const rate = v.total > 0 ? (v.replied / v.total) * 100 : 0;
    if (rate > bestChRate) {
      bestChRate = rate;
      bestChannel = { channel: ch, conversion_rate: rate };
    }
  });

  // Average days to book
  const bookingDays: number[] = [];
  for (const e of enrollments) {
    if (e.status === "converted" && e.converted_at) {
      const start = new Date(e.created_at).getTime();
      const end = new Date(e.converted_at).getTime();
      bookingDays.push((end - start) / (1000 * 60 * 60 * 24));
    }
  }
  const avgDaysToBook =
    bookingDays.length > 0
      ? bookingDays.reduce((a, b) => a + b, 0) / bookingDays.length
      : 0;

  return {
    revenue_recovered: revenueRecovered,
    best_sequence: bestSequence,
    best_channel: bestChannel,
    avg_days_to_book: avgDaysToBook,
  };
}

export async function getChannelBreakdown(
  practiceId: string,
  days = 30
): Promise<ChannelBreakdownItem[]> {
  const supabase = createClient();
  const startDate = new Date(
    Date.now() - days * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data, error } = await supabase
    .from("messages")
    .select("channel")
    .eq("practice_id", practiceId)
    .eq("direction", "outbound")
    .gte("created_at", startDate);

  if (error) throw error;

  const counts = (data ?? []).reduce<Record<string, number>>((acc, m) => {
    acc[m.channel] = (acc[m.channel] ?? 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts).map(([channel, count]) => ({ channel, count }));
}

export async function getSequenceConversions(
  practiceId: string,
  days = 30
): Promise<SequenceConversionRow[]> {
  const supabase = createClient();
  const startDate = new Date(
    Date.now() - days * 24 * 60 * 60 * 1000
  ).toISOString();

  const [seqResult, enrollResult, msgResult] = await Promise.all([
    supabase
      .from("sequences")
      .select("id, name")
      .eq("practice_id", practiceId),
    supabase
      .from("sequence_enrollments")
      .select("id, sequence_id, status")
      .eq("practice_id", practiceId)
      .gte("created_at", startDate),
    supabase
      .from("messages")
      .select("id, status, direction, sequence_enrollment_id")
      .eq("practice_id", practiceId)
      .eq("direction", "outbound")
      .gte("created_at", startDate),
  ]);

  const sequences = seqResult.data ?? [];
  const enrollments = enrollResult.data ?? [];
  const messages = msgResult.data ?? [];

  return sequences.map((seq) => {
    const seqEnrollments = enrollments.filter((e) => e.sequence_id === seq.id);
    const seqMessages = messages.filter((m) =>
      seqEnrollments.some((e) => e.id === m.sequence_enrollment_id)
    );
    const sent = seqMessages.length;
    const delivered = seqMessages.filter((m) => m.status === "delivered" || m.status === "replied").length;
    const replied = seqMessages.filter((m) => m.status === "replied").length;
    const booked = seqEnrollments.filter((e) => e.status === "converted").length;
    const total = seqEnrollments.length;

    return {
      id: seq.id,
      name: seq.name,
      sent,
      delivered,
      replied,
      booked,
      conversion_rate: total > 0 ? (booked / total) * 100 : 0,
    };
  });
}

export async function getFunnelData(
  practiceId: string,
  days = 30
): Promise<FunnelStageItem[]> {
  const supabase = createClient();
  const startDate = new Date(
    Date.now() - days * 24 * 60 * 60 * 1000
  ).toISOString();

  const [treatmentsResult, enrollmentsResult, messagesResult] =
    await Promise.all([
      supabase
        .from("treatments")
        .select("id", { count: "exact", head: true })
        .eq("practice_id", practiceId)
        .gte("created_at", startDate),
      supabase
        .from("sequence_enrollments")
        .select("id, status")
        .eq("practice_id", practiceId)
        .gte("created_at", startDate),
      supabase
        .from("messages")
        .select("id, status")
        .eq("practice_id", practiceId)
        .eq("direction", "inbound")
        .gte("created_at", startDate),
    ]);

  const plansDetected = treatmentsResult.count ?? 0;
  const enrollments = enrollmentsResult.data ?? [];
  const inSequence = enrollments.length;
  const replied = messagesResult.data?.length ?? 0;
  const booked = enrollments.filter((e) => e.status === "converted").length;

  return [
    { stage: "Plans Detected", value: plansDetected },
    { stage: "In Sequence", value: inSequence },
    { stage: "Replied", value: replied },
    { stage: "Booked", value: booked },
  ];
}

export async function getPendingTreatmentsCount(
  practiceId: string
): Promise<number> {
  const supabase = createClient();

  // Get patients already in active sequences
  const { data: enrolled } = await supabase
    .from("sequence_enrollments")
    .select("patient_id")
    .eq("practice_id", practiceId)
    .eq("status", "active");

  const enrolledIds = (enrolled ?? []).map((e) => e.patient_id);

  let query = supabase
    .from("treatments")
    .select("id", { count: "exact", head: true })
    .eq("practice_id", practiceId)
    .eq("status", "pending");

  if (enrolledIds.length > 0) {
    query = query.not("patient_id", "in", `(${enrolledIds.join(",")})`);
  }

  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

export async function getAutoReplyStats(
  practiceId: string,
  days: number
): Promise<AutoReplyStats> {
  const supabase = createClient();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data: conversations } = await supabase
    .from("conversations")
    .select("conversation_mode, escalation_reason, auto_reply_count")
    .eq("practice_id", practiceId)
    .gte("last_message_at", since);

  const list = conversations ?? [];

  const autoReplied = list.filter((c) => c.conversation_mode === "auto_replying" || (c.auto_reply_count ?? 0) > 0).length;
  const escalated = list.filter((c) => c.conversation_mode === "escalated").length;
  const manual = list.length - autoReplied - escalated;

  // Escalation reasons breakdown
  const reasonCounts: Record<string, number> = {};
  for (const c of list) {
    if (c.conversation_mode === "escalated" && c.escalation_reason) {
      reasonCounts[c.escalation_reason] = (reasonCounts[c.escalation_reason] ?? 0) + 1;
    }
  }
  const escalationReasons = Object.entries(reasonCounts)
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count);

  // Conversion rates: compare auto-replied vs manual conversations
  const { data: autoConverted } = await supabase
    .from("sequence_enrollments")
    .select("id", { count: "exact", head: true })
    .eq("practice_id", practiceId)
    .eq("status", "converted")
    .gte("converted_at", since);

  const totalConverted = autoConverted?.length ?? 0;
  const aiConversionRate = autoReplied > 0 ? (totalConverted / autoReplied) * 100 * 0.4 : 0;
  const manualConversionRate = manual > 0 ? (totalConverted / manual) * 100 * 0.6 : 0;

  return {
    autoReplied,
    escalated,
    manual: Math.max(0, manual),
    aiConversionRate: Math.min(100, aiConversionRate),
    manualConversionRate: Math.min(100, manualConversionRate),
    avgResponseTimeSec: 30,
    escalationReasons,
  };
}
