"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export function ComparisonCTA() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
      className="mt-16 text-center"
    >
      <p
        className="text-lg md:text-xl font-semibold text-[var(--m-navy)] mb-6"
        style={{ fontFamily: "var(--font-playfair)" }}
      >
        See $28,000+ in recovered revenue before you connect a single patient.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          href="/request-demo"
          className="inline-flex items-center justify-center rounded-lg bg-[var(--m-teal-mid)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--m-teal)] transition-colors shadow-sm"
          style={{ fontFamily: "var(--font-dm-sans)" }}
        >
          Request a Demo →
        </Link>
      </div>
      <p
        className="mt-3 text-xs text-[var(--m-slate)]"
        style={{ fontFamily: "var(--font-dm-sans)" }}
      >
        Try Retaine instantly with demo data
      </p>
    </motion.div>
  );
}
