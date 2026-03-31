"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

function DashboardMockup() {
  return (
    <div className="relative animate-float">
      <div className="rounded-xl border border-[var(--m-border)] bg-white shadow-xl p-6 max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <span
            className="text-sm font-medium text-[var(--m-slate)]"
            style={{ fontFamily: "var(--font-dm-sans)" }}
          >
            Revenue Recovered
          </span>
          <span
            className="text-xs font-medium text-[var(--m-teal)]"
            style={{ fontFamily: "var(--font-dm-sans)" }}
          >
            &uarr; 34%
          </span>
        </div>
        <div className="flex items-baseline gap-2 mb-4">
          <span
            className="text-3xl font-bold text-[var(--m-navy)]"
            style={{ fontFamily: "var(--font-dm-mono)" }}
          >
            $12,450
          </span>
          <span
            className="text-xs text-[var(--m-slate-light)]"
            style={{ fontFamily: "var(--font-dm-sans)" }}
          >
            vs last month
          </span>
        </div>

        <div className="h-px bg-[var(--m-border)] mb-4" />

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { value: "12", label: "Plans in sequence" },
            { value: "34%", label: "Convert rate" },
            { value: "847", label: "Messages sent" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg bg-[var(--m-off-white)] p-3 text-center"
            >
              <div
                className="text-lg font-bold text-[var(--m-teal)]"
                style={{ fontFamily: "var(--font-dm-mono)" }}
              >
                {stat.value}
              </div>
              <div
                className="text-[10px] text-[var(--m-slate-light)] mt-0.5"
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Recent activity */}
        <div
          className="text-xs font-semibold text-[var(--m-navy)] mb-2"
          style={{ fontFamily: "var(--font-dm-sans)" }}
        >
          Recent Activity
        </div>
        <div className="space-y-2">
          {[
            {
              name: "Maria C.",
              treatment: "Crown #14",
              amount: "$1,450",
              status: "Booked",
              statusColor: "text-[var(--m-teal)]",
              icon: "\u2713",
            },
            {
              name: "James W.",
              treatment: "Implant",
              amount: "$3,800",
              status: "Reply",
              statusColor: "text-blue-500",
              icon: "\uD83D\uDCAC",
            },
            {
              name: "Priya N.",
              treatment: "Bridge #28",
              amount: "$3,200",
              status: "Sent",
              statusColor: "text-[var(--m-slate-light)]",
              icon: "\uD83D\uDCE4",
            },
          ].map((row) => (
            <div
              key={row.name}
              className="flex items-center justify-between text-xs"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--m-teal)]" />
                <span className="font-medium text-[var(--m-navy)]">
                  {row.name}
                </span>
                <span className="text-[var(--m-slate-light)]">
                  {row.treatment}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="font-medium text-[var(--m-navy)]"
                  style={{ fontFamily: "var(--font-dm-mono)" }}
                >
                  {row.amount}
                </span>
                <span className={`${row.statusColor} font-medium`}>
                  {row.icon} {row.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="h-px bg-[var(--m-border)] mt-4 mb-3" />
        <div
          className="text-[10px] text-[var(--m-slate-light)]"
          style={{ fontFamily: "var(--font-dm-sans)" }}
        >
          <span className="text-[var(--m-amber)]">&#9889;</span> 3 sequences
          running &middot; 8 plans in queue
        </div>
      </div>
    </div>
  );
}

export function HeroSection() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <section className="bg-[var(--m-off-white)]">
      <div className="mx-auto max-w-[1200px] px-6 py-16 md:py-24">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-12">
          {/* Left column */}
          <div>
            <span
              className="inline-block text-xs font-semibold uppercase tracking-widest text-[var(--m-teal)] mb-4"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              AI-Powered Treatment Plan Follow-Up
            </span>

            <h1
              className="text-4xl md:text-[52px] md:leading-[1.15] font-bold text-[var(--m-navy)] mb-6"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              <span
                className={`block transition-all duration-500 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
              >
                Your patients said yes.
              </span>
              <span
                className={`block transition-all duration-500 delay-100 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
              >
                Then life got in the way.
              </span>
              <span
                className={`block transition-all duration-500 delay-200 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
              >
                We bring them back.
              </span>
            </h1>

            <p
              className="text-lg text-[var(--m-slate)] leading-relaxed mb-8 max-w-lg"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              FollowDent automatically follows up with patients who have
              unscheduled treatment plans — via SMS, email, and voicemail — and
              turns accepted plans into booked appointments. Average practices
              recover $150,000+ in unscheduled revenue per year.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <Link
                href="/request-demo"
                className="inline-flex items-center justify-center rounded-lg bg-[var(--m-teal)] px-6 py-3 text-base font-semibold text-white hover:bg-[var(--m-teal-mid)] hover:scale-[1.02] transition-all duration-150"
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                Request a Demo &rarr;
              </Link>
            </div>

            <div
              className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--m-slate-light)]"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              <span>&#x1F512; HIPAA Compliant</span>
              <span>&middot;</span>
              <span>No credit card required</span>
              <span>&middot;</span>
              <span>Launching soon — join the waitlist</span>
            </div>
          </div>

          {/* Right column */}
          <div
            className={`hidden lg:block flex-shrink-0 transition-all duration-700 delay-200 ${mounted ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}`}
          >
            <DashboardMockup />
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
}
