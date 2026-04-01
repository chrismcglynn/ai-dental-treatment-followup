"use client";

import { motion } from "framer-motion";
import { Check, X, Minus } from "lucide-react";
import {
  COMPETITORS,
  COMPARISON_MATRIX,
  type FeatureIndicator,
  type Competitor,
} from "./comparisonData";

const tableVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
} as const;

const rowVariants = {
  hidden: { opacity: 0, x: -16 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.35, ease: "easeOut" as const },
  },
} as const;

const retaineHeaderVariants = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
} as const;

function IndicatorCell({
  indicator,
  isRetaine,
}: {
  indicator: FeatureIndicator;
  isRetaine: boolean;
}) {
  if (indicator.type === "full") {
    return (
      <div className="flex flex-col items-center gap-0.5">
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center ${
            isRetaine
              ? "bg-[var(--m-teal)] text-white"
              : "bg-[var(--m-teal-light)] text-[var(--m-teal)]"
          }`}
        >
          <Check className="w-3.5 h-3.5" strokeWidth={3} />
        </div>
        <span
          className="text-[10px] text-[var(--m-slate)]"
          style={{ fontFamily: "var(--font-dm-sans)" }}
        >
          {indicator.label || "Yes"}
        </span>
      </div>
    );
  }

  if (indicator.type === "partial") {
    return (
      <div className="flex flex-col items-center gap-0.5">
        <div className="w-6 h-6 rounded-full flex items-center justify-center bg-gray-100 text-gray-400">
          <div className="w-3 h-3 rounded-full border-2 border-gray-300 bg-gray-100 relative overflow-hidden">
            <div className="absolute inset-0 bg-gray-300" style={{ clipPath: "inset(0 50% 0 0)" }} />
          </div>
        </div>
        <span
          className="text-[10px] text-gray-400"
          style={{ fontFamily: "var(--font-dm-sans)" }}
        >
          {indicator.label || "Partial"}
        </span>
      </div>
    );
  }

  if (indicator.type === "na") {
    return (
      <div className="flex flex-col items-center gap-0.5">
        <div className="w-6 h-6 rounded-full flex items-center justify-center">
          <Minus className="w-3.5 h-3.5 text-gray-300" />
        </div>
        <span
          className="text-[10px] text-gray-300"
          style={{ fontFamily: "var(--font-dm-sans)" }}
        >
          {indicator.label || "N/A"}
        </span>
      </div>
    );
  }

  // none
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="w-6 h-6 rounded-full flex items-center justify-center">
        <X className="w-3.5 h-3.5 text-gray-300" />
      </div>
      <span
        className="text-[10px] text-gray-300"
        style={{ fontFamily: "var(--font-dm-sans)" }}
      >
        {indicator.label || "No"}
      </span>
    </div>
  );
}

function CompetitorHeader({ competitor }: { competitor: Competitor }) {
  const isRetaine = competitor.isRetaine;

  const inner = (
    <div
      className={`px-3 py-4 text-center rounded-t-xl ${
        isRetaine
          ? "bg-[var(--m-teal)] text-white"
          : "bg-[var(--m-off-white)] text-[var(--m-navy)]"
      }`}
    >
      <div
        className="text-sm font-bold"
        style={{ fontFamily: "var(--font-dm-sans)" }}
      >
        {competitor.name}
      </div>
      <div
        className={`text-[10px] mt-0.5 ${
          isRetaine ? "text-white/80" : "text-[var(--m-slate)]"
        }`}
        style={{ fontFamily: "var(--font-dm-sans)" }}
      >
        {competitor.descriptor}
      </div>
    </div>
  );

  if (isRetaine) {
    return (
      <motion.th
        className="min-w-[130px] sticky left-[180px] z-20 md:static"
        variants={retaineHeaderVariants}
      >
        <div className="relative">
          {inner}
          <div className="absolute inset-0 rounded-t-xl shadow-[0_0_20px_rgba(42,123,111,0.2)] pointer-events-none" />
        </div>
      </motion.th>
    );
  }

  return (
    <th className="min-w-[130px]">
      {inner}
    </th>
  );
}

export function ComparisonTable() {
  return (
    <div className="overflow-x-auto -mx-6 px-6">
      <motion.table
        className="w-full border-collapse min-w-[800px]"
        variants={tableVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        <thead>
          <motion.tr variants={rowVariants}>
            <th className="min-w-[180px] sticky left-0 z-10 bg-white" />
            {COMPETITORS.map((c) => (
              <CompetitorHeader key={c.id} competitor={c} />
            ))}
          </motion.tr>
        </thead>
        <tbody>
          {COMPARISON_MATRIX.map((row, i) => (
            <motion.tr
              key={row.feature.id}
              variants={rowVariants}
              className={`border-b border-[var(--m-border)] ${
                row.feature.highlighted
                  ? "bg-[var(--m-teal-light)]"
                  : i % 2 === 0
                    ? "bg-white"
                    : "bg-[var(--m-off-white)]/50"
              }`}
            >
              <td
                className={`px-4 py-4 sticky left-0 z-10 ${
                  row.feature.highlighted
                    ? "bg-[var(--m-teal-light)] border-l-2 border-l-[var(--m-teal)]"
                    : i % 2 === 0
                      ? "bg-white"
                      : "bg-[var(--m-off-white)]/50"
                }`}
              >
                <div
                  className="text-sm font-medium text-[var(--m-navy)]"
                  style={{ fontFamily: "var(--font-dm-sans)" }}
                >
                  {row.feature.label}
                </div>
                {row.feature.description && (
                  <div
                    className="text-[11px] text-[var(--m-slate)] mt-0.5 hidden lg:block"
                    style={{ fontFamily: "var(--font-dm-sans)" }}
                  >
                    {row.feature.description}
                  </div>
                )}
              </td>
              {COMPETITORS.map((c) => (
                <td
                  key={c.id}
                  className={`px-3 py-4 ${
                    c.isRetaine && row.feature.highlighted
                      ? "bg-[var(--m-teal-light)]"
                      : c.isRetaine
                        ? "bg-[var(--m-teal-light)]/30"
                        : ""
                  } ${
                    c.isRetaine ? "sticky left-[180px] z-10 md:static" : ""
                  }`}
                >
                  <IndicatorCell
                    indicator={row.indicators[c.id]}
                    isRetaine={!!c.isRetaine}
                  />
                </td>
              ))}
            </motion.tr>
          ))}
        </tbody>
      </motion.table>
    </div>
  );
}
