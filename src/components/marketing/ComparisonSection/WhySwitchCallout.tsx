"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export function WhySwitchCallout() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="mt-16 mx-auto max-w-2xl"
    >
      <div className="rounded-2xl border border-[var(--m-border)] bg-[var(--m-off-white)] p-8 md:p-10 relative overflow-hidden">
        {/* Subtle teal accent */}
        <div className="absolute top-0 left-0 w-1 h-full bg-[var(--m-teal)]" />

        <h3
          className="text-xl md:text-2xl font-bold text-[var(--m-navy)] mb-3"
          style={{ fontFamily: "var(--font-playfair)" }}
        >
          Already using Weave?
        </h3>
        <p
          className="text-base text-[var(--m-slate)] leading-relaxed mb-6"
          style={{ fontFamily: "var(--font-dm-sans)" }}
        >
          Weave is excellent for phones, payments, and appointment reminders —
          we&apos;re not here to replace it. Retaine does the one thing Weave
          doesn&apos;t: it runs your treatment plan follow-up automatically,
          from detection to booked appointment, with no staff involvement. Most
          practices run both.
        </p>
        <a
          href="#how-it-works"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--m-teal)] hover:text-[var(--m-teal-mid)] transition-colors"
          style={{ fontFamily: "var(--font-dm-sans)" }}
        >
          See how Retaine works
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </motion.div>
  );
}
