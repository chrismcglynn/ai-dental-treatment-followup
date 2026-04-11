"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatedConversationMockup } from "./AnimatedConversationMockup";
import { EscalationFlowMockup } from "./EscalationFlowMockup";

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

function SequenceBuilderMockup() {
  return (
    <div className="rounded-xl border border-[var(--m-border)] bg-white shadow-lg p-5 max-w-sm">
      <div className="flex items-center justify-between mb-3">
        <div
          className="text-xs font-semibold text-[var(--m-navy)]"
          style={{ fontFamily: "var(--font-dm-sans)" }}
        >
          Sequence: Crown Follow-Up
        </div>
        <span
          className="inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full bg-[var(--m-teal-light)] text-[var(--m-teal)] border border-[var(--m-teal)]/20"
          style={{ fontFamily: "var(--font-dm-sans)" }}
        >
          &#x2728; AI Generated
        </span>
      </div>
      <div className="space-y-3">
        {[
          { day: "Day 3", channel: "SMS", color: "bg-blue-100 text-blue-700" },
          {
            day: "Day 10",
            channel: "Email",
            color: "bg-purple-100 text-purple-700",
          },
          {
            day: "Day 21",
            channel: "Voicemail",
            color: "bg-orange-100 text-orange-700",
          },
        ].map((step) => (
          <div
            key={step.day}
            className="flex items-center gap-3"
            style={{ fontFamily: "var(--font-dm-sans)" }}
          >
            <div className="w-1 h-8 rounded bg-[var(--m-teal)]" />
            <div className="flex-1 flex items-center justify-between rounded-lg bg-[var(--m-off-white)] px-3 py-2">
              <span className="text-xs font-medium text-[var(--m-navy)]">
                {step.day}
              </span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${step.color}`}
              >
                {step.channel}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span
          className="text-[10px] text-[var(--m-slate-light)]"
          style={{ fontFamily: "var(--font-dm-sans)" }}
        >
          Tone:
        </span>
        {["Friendly", "Clinical", "Urgent"].map((tone, i) => (
          <span
            key={tone}
            className={`text-[10px] px-2 py-0.5 rounded-full border ${i === 0 ? "border-[var(--m-teal)] text-[var(--m-teal)] bg-[var(--m-teal-light)]" : "border-[var(--m-border)] text-[var(--m-slate-light)]"}`}
            style={{ fontFamily: "var(--font-dm-sans)" }}
          >
            {tone}
          </span>
        ))}
      </div>
      <div className="mt-3 rounded-lg bg-[var(--m-teal-light)] px-3 py-2">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-[10px] text-[var(--m-teal)] font-semibold">
            AI Preview
          </span>
        </div>
        <p
          className="text-[11px] text-[var(--m-slate)] leading-snug"
          style={{ fontFamily: "var(--font-dm-sans)" }}
        >
          &quot;Hi Maria, this is a reminder from Dr. Smith&apos;s office about
          your treatment plan. We&apos;d love to get that scheduled for
          you...&quot;
        </p>
      </div>
      {/* AI match score */}
      <div className="mt-3 flex items-center gap-2 rounded-lg border border-dashed border-[var(--m-teal)]/30 px-3 py-2">
        <div className="flex items-center gap-1.5">
          <span
            className="text-[10px] font-semibold text-[var(--m-teal)]"
            style={{ fontFamily: "var(--font-dm-mono)" }}
          >
            92%
          </span>
          <span
            className="text-[10px] text-[var(--m-slate)]"
            style={{ fontFamily: "var(--font-dm-sans)" }}
          >
            match for D2740 Crown
          </span>
        </div>
        <span
          className="ml-auto text-[9px] font-medium text-[var(--m-teal)] px-1.5 py-0.5 rounded bg-[var(--m-teal-light)]"
          style={{ fontFamily: "var(--font-dm-sans)" }}
        >
          AI Recommended
        </span>
      </div>
    </div>
  );
}

function InboxMockup() {
  return (
    <div className="rounded-xl border border-[var(--m-border)] bg-white shadow-lg overflow-hidden max-w-sm">
      <div className="flex">
        {/* Conversation list */}
        <div className="w-1/3 border-r border-[var(--m-border)] bg-[var(--m-off-white)]">
          {[
            {
              name: "Maria C.",
              unread: true,
              intent: "Wants to book",
              intentColor: "bg-emerald-100 text-emerald-700",
            },
            {
              name: "James W.",
              unread: true,
              intent: "Has question",
              intentColor: "bg-blue-100 text-blue-700",
            },
            {
              name: "Priya N.",
              unread: false,
              intent: "Not ready",
              intentColor: "bg-gray-100 text-gray-500",
            },
          ].map((conv) => (
            <div
              key={conv.name}
              className={`px-3 py-2.5 border-b border-[var(--m-border)] ${conv.unread ? "bg-white" : ""}`}
            >
              <div
                className="text-[11px] font-medium text-[var(--m-navy)] flex items-center gap-1"
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                {conv.unread && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--m-teal)]" />
                )}
                {conv.name}
              </div>
              <span
                className={`inline-block text-[8px] font-medium px-1.5 py-0.5 rounded-full mt-1 ${conv.intentColor}`}
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                {conv.intent}
              </span>
            </div>
          ))}
        </div>
        {/* Thread */}
        <div className="w-2/3 p-3">
          <div className="flex items-center justify-between mb-3">
            <div
              className="text-xs font-semibold text-[var(--m-navy)]"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              Maria C. — Crown #14
            </div>
            <span
              className="text-[8px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              &#x2713; Wants to book
            </span>
          </div>
          <div className="space-y-2">
            <div className="rounded-lg bg-[var(--m-teal-light)] px-3 py-2 max-w-[85%]">
              <p
                className="text-[11px] text-[var(--m-slate)]"
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                Hi Maria, just a reminder about your treat...
              </p>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-[9px] text-[var(--m-teal)]">
                  Delivered
                </span>
              </div>
            </div>
            <div className="rounded-lg bg-[var(--m-off-white)] px-3 py-2 max-w-[85%] ml-auto">
              <p
                className="text-[11px] text-[var(--m-navy)]"
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                Hi yes I&apos;d like to schedule that crown
              </p>
            </div>
          </div>
          {/* AI suggest reply */}
          <div className="mt-2 rounded-lg bg-[var(--m-teal-light)] border border-[var(--m-teal)]/20 px-3 py-2">
            <div className="flex items-center gap-1 mb-1">
              <span className="text-[9px]">&#x2728;</span>
              <span
                className="text-[9px] font-semibold text-[var(--m-teal)]"
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                AI Suggested Reply
              </span>
            </div>
            <p
              className="text-[10px] text-[var(--m-slate)] leading-snug"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              &quot;Great! We have openings this week. Would Thursday at 2pm work
              for you?&quot;
            </p>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 rounded-lg border border-[var(--m-border)] px-3 py-1.5">
              <span
                className="text-[10px] text-[var(--m-slate-light)]"
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                Type a reply...
              </span>
            </div>
            <button className="rounded-lg bg-[var(--m-teal)] px-2.5 py-1.5 text-[9px] font-semibold text-white">
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AnalyticsMockup() {
  return (
    <div className="rounded-xl border border-[var(--m-border)] bg-white shadow-lg p-5 max-w-sm">
      <div
        className="text-xs font-semibold text-[var(--m-navy)] mb-3"
        style={{ fontFamily: "var(--font-dm-sans)" }}
      >
        Revenue Recovered
      </div>
      {/* Simple area chart mockup */}
      <svg
        viewBox="0 0 300 80"
        className="w-full mb-4"
        aria-label="Revenue trend chart"
      >
        <defs>
          <linearGradient id="tealGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--m-teal)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--m-teal)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M0,70 L50,55 L100,60 L150,40 L200,30 L250,20 L300,10 L300,80 L0,80 Z"
          fill="url(#tealGrad)"
        />
        <path
          d="M0,70 L50,55 L100,60 L150,40 L200,30 L250,20 L300,10"
          fill="none"
          stroke="var(--m-teal)"
          strokeWidth="2"
        />
      </svg>
      {/* Channel breakdown */}
      <div className="flex items-center gap-4 mb-4">
        {[
          { label: "SMS", pct: "60%", color: "bg-[var(--m-teal)]" },
          { label: "Email", pct: "30%", color: "bg-purple-500" },
          { label: "Voicemail", pct: "10%", color: "bg-orange-400" },
        ].map((ch) => (
          <div key={ch.label} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${ch.color}`} />
            <span
              className="text-[10px] text-[var(--m-slate)]"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              {ch.label} {ch.pct}
            </span>
          </div>
        ))}
      </div>
      {/* Funnel */}
      <div className="space-y-1.5">
        {[
          { label: "Sent", width: "100%", count: "847" },
          { label: "Delivered", width: "92%", count: "779" },
          { label: "Replied", width: "38%", count: "322" },
          { label: "Booked", width: "34%", count: "288" },
        ].map((step) => (
          <div key={step.label} className="flex items-center gap-2">
            <span
              className="text-[10px] text-[var(--m-slate)] w-16 text-right"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              {step.label}
            </span>
            <div className="flex-1 h-4 rounded bg-[var(--m-off-white)]">
              <div
                className="h-full rounded bg-[var(--m-teal)]/20"
                style={{ width: step.width }}
              >
                <div className="h-full rounded bg-[var(--m-teal)]" style={{ width: "100%" }}>
                  <span
                    className="text-[9px] text-white font-medium pl-1.5 leading-4"
                    style={{ fontFamily: "var(--font-dm-mono)" }}
                  >
                    {step.count}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PendingTriageMockup() {
  return (
    <div className="rounded-xl border border-[var(--m-border)] bg-white shadow-lg p-5 max-w-sm">
      <div className="flex items-center justify-between mb-3">
        <div
          className="text-xs font-semibold text-[var(--m-navy)]"
          style={{ fontFamily: "var(--font-dm-sans)" }}
        >
          Pending Treatments
        </div>
        <span
          className="text-[10px] font-medium text-[var(--m-teal)]"
          style={{ fontFamily: "var(--font-dm-sans)" }}
        >
          3 selected &middot; $6,450
        </span>
      </div>
      {/* Treatment rows */}
      <div className="space-y-1.5 mb-4">
        {[
          {
            name: "Maria C.",
            code: "D2740",
            desc: "Crown",
            amount: "$1,450",
            selected: true,
          },
          {
            name: "James W.",
            code: "D6010",
            desc: "Implant",
            amount: "$3,800",
            selected: true,
          },
          {
            name: "Priya N.",
            code: "D2740",
            desc: "Crown",
            amount: "$1,200",
            selected: true,
          },
        ].map((row) => (
          <div
            key={row.name}
            className="flex items-center gap-2 rounded-lg bg-[var(--m-teal-light)] px-3 py-2"
          >
            <span className="w-3.5 h-3.5 rounded border-2 border-[var(--m-teal)] bg-[var(--m-teal)] flex items-center justify-center">
              <span className="text-[8px] text-white font-bold">&#x2713;</span>
            </span>
            <span
              className="text-[11px] font-medium text-[var(--m-navy)] flex-1"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              {row.name}
            </span>
            <span
              className="text-[9px] text-[var(--m-slate)] px-1.5 py-0.5 rounded bg-white"
              style={{ fontFamily: "var(--font-dm-mono)" }}
            >
              {row.code}
            </span>
            <span
              className="text-[10px] font-medium text-[var(--m-navy)]"
              style={{ fontFamily: "var(--font-dm-mono)" }}
            >
              {row.amount}
            </span>
          </div>
        ))}
      </div>
      {/* AI recommendation */}
      <div className="rounded-lg border border-[var(--m-teal)]/30 bg-[var(--m-teal-light)] p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-[10px]">&#x2728;</span>
          <span
            className="text-[10px] font-semibold text-[var(--m-teal)]"
            style={{ fontFamily: "var(--font-dm-sans)" }}
          >
            AI Sequence Match
          </span>
        </div>
        <div className="space-y-1.5">
          {[
            {
              name: "Crown Follow-Up",
              score: "92%",
              codes: "2/2 codes",
              recommended: true,
            },
            {
              name: "Implant Consult",
              score: "88%",
              codes: "1/1 codes",
              recommended: false,
            },
          ].map((seq) => (
            <div
              key={seq.name}
              className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 ${seq.recommended ? "bg-white border border-[var(--m-teal)]/30" : "bg-white/50"}`}
            >
              {seq.recommended && (
                <span className="w-2 h-2 rounded-full bg-[var(--m-teal)]" />
              )}
              <span
                className={`text-[10px] font-medium flex-1 ${seq.recommended ? "text-[var(--m-navy)]" : "text-[var(--m-slate)]"}`}
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                {seq.name}
              </span>
              <span
                className="text-[9px] text-[var(--m-slate)]"
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                {seq.codes}
              </span>
              <span
                className="text-[10px] font-bold text-[var(--m-teal)]"
                style={{ fontFamily: "var(--font-dm-mono)" }}
              >
                {seq.score}
              </span>
            </div>
          ))}
        </div>
      </div>
      <button
        className="mt-3 w-full rounded-lg bg-[var(--m-teal)] py-2 text-[11px] font-semibold text-white"
        style={{ fontFamily: "var(--font-dm-sans)" }}
      >
        Enroll 3 patients &rarr;
      </button>
    </div>
  );
}

function PatientPortalMockup() {
  return (
    <div className="rounded-2xl border-4 border-gray-800 bg-white shadow-lg p-4 max-w-[220px] mx-auto">
      {/* Phone frame feel */}
      <div className="rounded-xl overflow-hidden">
        <div className="bg-[var(--m-teal)] px-3 py-2">
          <span
            className="text-[10px] text-white font-semibold"
            style={{ fontFamily: "var(--font-dm-sans)" }}
          >
            Your Treatment Plan
          </span>
        </div>
        <div className="px-3 py-3 space-y-3">
          <div>
            <div
              className="text-[10px] text-[var(--m-slate-light)]"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              Treatment
            </div>
            <div
              className="text-xs font-medium text-[var(--m-navy)]"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              Crown — Tooth #14
            </div>
          </div>
          <div>
            <div
              className="text-[10px] text-[var(--m-slate-light)]"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              Estimated Cost
            </div>
            <div
              className="text-sm font-bold text-[var(--m-navy)]"
              style={{ fontFamily: "var(--font-dm-mono)" }}
            >
              $1,450
            </div>
          </div>
          <div className="h-px bg-[var(--m-border)]" />
          <div>
            <div
              className="text-[10px] font-semibold text-[var(--m-navy)] mb-1.5"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              Preferred Days
            </div>
            <div className="flex gap-1 flex-wrap">
              {["Mon", "Tue", "Wed", "Thu", "Fri"].map((d, i) => (
                <span
                  key={d}
                  className={`text-[9px] px-1.5 py-0.5 rounded ${[0, 2, 3].includes(i) ? "bg-[var(--m-teal)] text-white" : "bg-[var(--m-off-white)] text-[var(--m-slate-light)]"}`}
                  style={{ fontFamily: "var(--font-dm-sans)" }}
                >
                  {d}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div
              className="text-[10px] font-semibold text-[var(--m-navy)] mb-1.5"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              Preferred Time
            </div>
            <div className="flex gap-1 flex-wrap">
              {["Early AM", "Late AM", "Afternoon"].map((t, i) => (
                <span
                  key={t}
                  className={`text-[9px] px-1.5 py-0.5 rounded ${i === 1 ? "bg-[var(--m-teal)] text-white" : "bg-[var(--m-off-white)] text-[var(--m-slate-light)]"}`}
                  style={{ fontFamily: "var(--font-dm-sans)" }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <button className="w-full rounded-lg bg-[var(--m-teal)] py-1.5 text-[10px] font-semibold text-white">
            Request Appointment
          </button>
          <p className="text-[8px] text-[var(--m-slate-light)] text-center">
            Link expires in 72 hours
          </p>
        </div>
      </div>
    </div>
  );
}

const rows = [
  {
    title: "Describe the procedure. AI builds the entire sequence.",
    body: "Tell Retaine what you're following up on — crowns, implants, SRP — and AI generates a complete multi-step sequence: channels, timing, tone progression, and personalized messages. Already have sequences? AI automatically matches new treatment plans to the best one with a confidence score. You review, tweak, and approve. Drag steps to reorder. Set delays in days or hours.",
    visual: <SequenceBuilderMockup />,
  },
  {
    title: "Select treatments. AI picks the right sequence instantly.",
    body: "Your pending treatments page shows every accepted plan that hasn't been scheduled — with total revenue at stake. Select patients, and AI instantly ranks your sequences by relevance: matching procedure codes, treatment categories, and past conversion performance. One click to enroll. No guesswork, no manual assignment.",
    visual: <PendingTriageMockup />,
  },
  {
    title: "AI handles the conversation — your team handles the exceptions.",
    body: "When patients reply, AI reads the message, classifies intent, and auto-replies in seconds. Routine responses like \"not ready yet\" or \"sounds good\" are handled automatically with a natural 30-second delay. Clinical questions, insurance inquiries, and scheduling requests are instantly escalated to your team with full context. Your staff only sees what actually needs a human.",
    visual: <AnimatedConversationMockup />,
  },
  {
    title: "Built-in guardrails you can trust.",
    body: "AI only auto-replies during your business hours and respects a per-conversation reply cap. Clinical concerns like pain, swelling, or bleeding are always escalated — never auto-replied. Insurance and scheduling questions go straight to your team. Every AI reply is tagged so you can audit at a glance. Staff can take over any conversation with one click, and return it to AI when they're done.",
    visual: <EscalationFlowMockup />,
  },
  {
    title: "Know exactly what's working.",
    body: "Track conversion rates by sequence, channel, and procedure type. See a full conversion funnel from message sent to appointment booked. Identify your best-performing sequences and channels. Prove ROI to your partners in one report.",
    visual: <AnalyticsMockup />,
  },
  {
    title: "Secure booking — no app download required.",
    body: "Patients receive a secure, single-use link to view their treatment plan details and request an appointment based on their preferred days and times. The link expires after 72 hours. HIPAA-compliant by design — token-based access with SHA-256 hashing. Works on any phone.",
    visual: <PatientPortalMockup />,
  },
];

function FeatureRow({
  title,
  body,
  visual,
  reversed,
}: {
  title: string;
  body: string;
  visual: React.ReactNode;
  reversed: boolean;
}) {
  const { ref, visible } = useScrollReveal();

  return (
    <div
      ref={ref}
      className={`grid grid-cols-1 lg:grid-cols-2 gap-10 items-center transition-all duration-[400ms] ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}
    >
      <div className={reversed ? "lg:order-2" : ""}>
        <h3
          className="text-2xl font-bold text-[var(--m-navy)] mb-3"
          style={{ fontFamily: "var(--font-playfair)" }}
        >
          {title}
        </h3>
        <p
          className="text-base text-[var(--m-slate)] leading-relaxed"
          style={{ fontFamily: "var(--font-dm-sans)" }}
        >
          {body}
        </p>
      </div>
      <div
        className={`flex justify-center ${reversed ? "lg:order-1" : ""}`}
      >
        {visual}
      </div>
    </div>
  );
}

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-white">
      <div className="mx-auto max-w-[1200px] px-6 py-16 md:py-24">
        <div className="text-center mb-16">
          <h2
            className="text-3xl md:text-4xl font-bold text-[var(--m-navy)]"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            From detected to booked — without lifting a finger
          </h2>
        </div>

        <div className="space-y-20">
          {rows.map((row, i) => (
            <FeatureRow
              key={row.title}
              title={row.title}
              body={row.body}
              visual={row.visual}
              reversed={i % 2 === 1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
