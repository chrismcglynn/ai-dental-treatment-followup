"use client";

import { useEffect, useRef, useState } from "react";

function useCountUp(target: number, duration = 1200, start = false) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    let raf: number;

    function animate(timestamp: number) {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setValue(Math.floor(progress * target));
      if (progress < 1) {
        raf = requestAnimationFrame(animate);
      }
    }

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, start]);

  return value;
}

function StatCard({
  value,
  prefix,
  suffix,
  label,
  source,
  inView,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
  source?: string;
  inView: boolean;
}) {
  const count = useCountUp(value, 1200, inView);

  return (
    <div className="rounded-xl bg-[var(--m-amber-light)] border border-[var(--m-amber)]/20 p-6 text-center">
      <div
        className="text-4xl font-bold text-[var(--m-amber)] mb-2"
        style={{ fontFamily: "var(--font-dm-mono)" }}
      >
        {prefix}
        {count.toLocaleString()}
        {suffix}
      </div>
      <p
        className="text-sm text-[var(--m-navy)] font-medium leading-snug"
        style={{ fontFamily: "var(--font-dm-sans)" }}
      >
        {label}
      </p>
      {source && (
        <p
          className="text-[10px] text-[var(--m-slate-light)] mt-2"
          style={{ fontFamily: "var(--font-dm-sans)" }}
        >
          {source}
        </p>
      )}
    </div>
  );
}

export function ProblemSection() {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="problem" className="bg-[var(--m-off-white)]">
      <div className="mx-auto max-w-[1200px] px-6 py-16 md:py-24">
        <div className="text-center mb-12">
          <span
            className="inline-block text-xs font-semibold uppercase tracking-widest text-[var(--m-red-soft)] mb-3"
            style={{ fontFamily: "var(--font-dm-sans)" }}
          >
            The Problem
          </span>
          <h2
            className="text-3xl md:text-4xl font-bold text-[var(--m-navy)]"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            Every dental practice has the same silent revenue leak
          </h2>
        </div>

        <div ref={ref} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <StatCard
            value={500000}
            prefix="$"
            label="Average annual unscheduled treatment backlog per practice"
            source="ADA"
            inView={inView}
          />
          <StatCard
            value={46}
            suffix="%"
            label="Treatment plan completion rate (down from 56%)"
            source="Planet DDS 2025"
            inView={inView}
          />
          <StatCard
            value={10}
            suffix="%"
            label="Drop-off rate after patient acceptance"
            source="Planet DDS 2025"
            inView={inView}
          />
        </div>

        <div className="max-w-2xl mx-auto text-center">
          <p
            className="text-base text-[var(--m-slate)] leading-relaxed mb-4"
            style={{ fontFamily: "var(--font-dm-sans)" }}
          >
            Patients accept treatment plans with good intentions — then forget,
            get busy, or feel overwhelmed by cost. Your front desk team is too
            stretched to personally follow up with every one of them. The result:
            hundreds of thousands of dollars in already-accepted treatment
            sitting unscheduled every single year.
          </p>
          <p
            className="text-base text-[var(--m-navy)] font-semibold"
            style={{ fontFamily: "var(--font-dm-sans)" }}
          >
            This isn&apos;t a patient problem. It&apos;s a systems problem. And
            it&apos;s solvable.
          </p>
        </div>
      </div>
    </section>
  );
}
