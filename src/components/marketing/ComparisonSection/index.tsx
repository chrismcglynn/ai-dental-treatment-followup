"use client";

import { motion } from "framer-motion";
import { ComparisonTable } from "./ComparisonTable";
import { CompetitorCards } from "./CompetitorCard";
import { WhySwitchCallout } from "./WhySwitchCallout";
import { ComparisonCTA } from "./ComparisonCTA";

export function ComparisonSection() {
  return (
    <section id="comparison" className="bg-white">
      <div className="mx-auto max-w-[1200px] px-6 py-16 md:py-24">
        {/* Section header */}
        <motion.div
          className="text-center mb-12 md:mb-16"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <span
            className="inline-block text-xs font-semibold tracking-widest uppercase text-[var(--m-teal)] mb-3"
            style={{ fontFamily: "var(--font-dm-sans)" }}
          >
            How Retaine compares
          </span>
          <h2
            className="text-3xl md:text-4xl font-bold text-[var(--m-navy)] mb-4"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            Built for treatment plan recovery. Not for everything else.
          </h2>
          <p
            className="max-w-2xl mx-auto text-base md:text-lg text-[var(--m-slate)] leading-relaxed"
            style={{ fontFamily: "var(--font-dm-sans)" }}
          >
            Most practices already use a communication tool. None of them are
            running automated multi-step sequences that track revenue recovered.
          </p>
        </motion.div>

        {/* Desktop/tablet table */}
        <div className="hidden md:block">
          <ComparisonTable />
        </div>

        {/* Mobile card view */}
        <div className="block md:hidden">
          <CompetitorCards />
        </div>

        {/* Why switch callout */}
        <WhySwitchCallout />

        {/* Bottom CTA */}
        <ComparisonCTA />
      </div>
    </section>
  );
}
