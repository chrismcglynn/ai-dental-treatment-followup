"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

export function HeroSection() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // Double-rAF ensures the browser paints the initial hidden state
    // before we trigger the transition
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setMounted(true);
      });
    });
  }, []);

  return (
    <section className="bg-[var(--m-off-white)]">
      <div className="mx-auto max-w-[1200px] px-6 pt-16 md:pt-24 pb-0">
        {/* Centered text */}
        <div className="text-center max-w-3xl mx-auto">
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
              className={`block transition-all duration-500 text-[--m-teal-mid] mt-2 delay-200 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            >
              We bring them back.
            </span>
          </h1>

          <p
            className="text-md text-[var(--m-slate-light)] leading-relaxed mb-8 max-w-2xl mx-auto"
            style={{ fontFamily: "var(--font-dm-sans)" }}
          >
            Retaine automatically recovers revenue from unscheduled treatment
            plans — following up with the right patient, at the right time,
            with AI-powered messages that sound like your front desk. Average
            practices recover $150,000+ per year.
          </p>

          <div className="flex justify-center gap-3 mb-6">
            <Link
              href="/request-demo"
              className="inline-flex items-center justify-center rounded-lg bg-[var(--m-teal-mid)] px-6 py-3 text-base font-semibold text-white hover:bg-[var(--m-teal)] hover:scale-[1.02] transition-all duration-150"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              Request a Demo &rarr;
            </Link>
          </div>

          <div
            className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-[var(--m-slate-light)] mb-12"
            style={{ fontFamily: "var(--font-dm-sans)" }}
          >
            <span>&#x1F512; HIPAA Compliant</span>
            <span>&middot;</span>
            <span>No credit card required</span>
            <span>&middot;</span>
            <span>Launching soon — join the waitlist</span>
          </div>
        </div>

        {/* Dashboard screenshot */}
        <div
          className={`transition-all duration-1000 ease-out delay-500 ${mounted ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-[0.97]"}`}
        >
          <div className={`rounded-xl overflow-hidden bg-white transition-shadow duration-1000 delay-1000 ${mounted ? "shadow-2xl" : "shadow-none"}`}>
            <Image
              src="/images/retaine-dashboard.png"
              alt="Retaine dashboard showing revenue recovered, active sequences, and real-time patient activity"
              width={1200}
              height={675}
              className="w-full h-auto -mt-px"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
