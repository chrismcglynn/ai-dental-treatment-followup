"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const CONVERSION_WITH_AI = 0.34;
const ANNUAL_COST = 199 * 12;

function calculate(plansPerMonth: number, avgValue: number) {
  const unscheduledRevenue = plansPerMonth * 0.3 * 12 * avgValue;
  const recovered = unscheduledRevenue * CONVERSION_WITH_AI;
  const roi = Math.round(recovered / ANNUAL_COST);
  const netGain = recovered - ANNUAL_COST;
  return { unscheduledRevenue, recovered, roi, netGain };
}

function useCountUp(target: number, duration = 800) {
  const [display, setDisplay] = useState(target);
  const rafRef = useRef<number>();
  const prevRef = useRef(target);

  useEffect(() => {
    const from = prevRef.current;
    const to = target;
    prevRef.current = target;

    if (from === to) return;

    let startTime: number | null = null;
    function animate(timestamp: number) {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplay(Math.floor(from + (to - from) * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    }

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return display;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function RevenueCalculator() {
  const [plans, setPlans] = useState(15);
  const [avgValue, setAvgValue] = useState(1200);

  const debouncedPlans = useDebounce(plans, 300);
  const debouncedAvg = useDebounce(avgValue, 300);

  const result = calculate(debouncedPlans, debouncedAvg);

  const unscheduledDisplay = useCountUp(Math.round(result.unscheduledRevenue));
  const recoveredDisplay = useCountUp(Math.round(result.recovered));
  const netGainDisplay = useCountUp(Math.round(result.netGain));
  const roiDisplay = useCountUp(result.roi);

  return (
    <section id="calculator" className="bg-[var(--m-navy)]">
      <div className="mx-auto max-w-[1200px] px-6 py-16 md:py-24">
        <div className="text-center mb-12">
          <h2
            className="text-3xl md:text-4xl font-bold text-white mb-3"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            How much is your practice leaving on the table?
          </h2>
          <p
            className="text-base text-[var(--m-slate-light)]"
            style={{ fontFamily: "var(--font-dm-sans)" }}
          >
            Enter two numbers. See your opportunity in seconds.
          </p>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-xl mx-auto mb-12">
          <div>
            <label
              className="block text-sm text-[var(--m-slate-light)] mb-2"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              New treatment plans / month
            </label>
            <input
              type="number"
              min={1}
              value={plans}
              onChange={(e) =>
                setPlans(Math.max(1, parseInt(e.target.value) || 1))
              }
              className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white text-lg font-medium focus:outline-none focus:border-[var(--m-teal)] transition-colors"
              style={{ fontFamily: "var(--font-dm-mono)" }}
            />
          </div>
          <div>
            <label
              className="block text-sm text-[var(--m-slate-light)] mb-2"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              Avg. treatment plan value
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 text-lg">
                $
              </span>
              <input
                type="number"
                min={100}
                value={avgValue}
                onChange={(e) =>
                  setAvgValue(Math.max(100, parseInt(e.target.value) || 100))
                }
                className="w-full rounded-lg border border-white/20 bg-white/5 pl-8 pr-4 py-3 text-white text-lg font-medium focus:outline-none focus:border-[var(--m-teal)] transition-colors"
                style={{ fontFamily: "var(--font-dm-mono)" }}
              />
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="max-w-3xl mx-auto rounded-xl border border-white/10 bg-white/5 p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
            <div>
              <div
                className="text-sm text-[var(--m-slate-light)] mb-1"
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                Without FollowDent
              </div>
              <div
                className="text-3xl font-bold text-[var(--m-red-soft)]"
                style={{ fontFamily: "var(--font-dm-mono)" }}
              >
                ${unscheduledDisplay.toLocaleString()}
              </div>
              <div
                className="text-xs text-[var(--m-slate-light)] mt-1"
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                accepted but never booked / year
              </div>
            </div>
            <div>
              <div
                className="text-sm text-[var(--m-slate-light)] mb-1"
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                With FollowDent
              </div>
              <div
                className="text-3xl font-bold text-[var(--m-teal-mid)]"
                style={{ fontFamily: "var(--font-dm-mono)" }}
              >
                ${recoveredDisplay.toLocaleString()}
              </div>
              <div
                className="text-xs text-[var(--m-slate-light)] mt-1"
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                recovered / year (at 34% avg conversion)
              </div>
            </div>
          </div>

          <div className="h-px bg-white/10 mb-8" />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            <div>
              <div
                className="text-xs text-[var(--m-slate-light)] mb-1"
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                Annual recovery
              </div>
              <div
                className="text-2xl md:text-[40px] font-bold text-[var(--m-amber)]"
                style={{ fontFamily: "var(--font-dm-mono)" }}
              >
                ${recoveredDisplay.toLocaleString()}
              </div>
            </div>
            <div>
              <div
                className="text-xs text-[var(--m-slate-light)] mb-1"
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                FollowDent cost per year
              </div>
              <div
                className="text-2xl md:text-[40px] font-bold text-white/60"
                style={{ fontFamily: "var(--font-dm-mono)" }}
              >
                ${ANNUAL_COST.toLocaleString()}
              </div>
            </div>
            <div>
              <div
                className="text-xs text-[var(--m-slate-light)] mb-1"
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                Net gain
              </div>
              <div
                className="text-2xl md:text-[40px] font-bold text-[var(--m-teal-mid)]"
                style={{ fontFamily: "var(--font-dm-mono)" }}
              >
                ${netGainDisplay.toLocaleString()}
              </div>
            </div>
            <div>
              <div
                className="text-xs text-[var(--m-slate-light)] mb-1"
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                ROI
              </div>
              <div
                className="text-2xl md:text-[40px] font-bold text-[var(--m-amber)]"
                style={{ fontFamily: "var(--font-dm-mono)" }}
              >
                &times;{roiDisplay}
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-10 text-center">
          <Link
            href="/request-demo"
            className="inline-flex items-center justify-center rounded-lg bg-[var(--m-teal)] px-8 py-3.5 text-base font-semibold text-white hover:bg-[var(--m-teal-mid)] hover:scale-[1.02] transition-all duration-150"
            style={{ fontFamily: "var(--font-dm-sans)" }}
          >
            Request a Demo to see FollowDent working on your actual treatment
            plan data &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}
