"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X, Minus } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  COMPETITORS,
  COMPARISON_MATRIX,
  type FeatureIndicator,
} from "./comparisonData";

function MobileIndicator({
  indicator,
  isRetaine,
}: {
  indicator: FeatureIndicator;
  isRetaine: boolean;
}) {
  if (indicator.type === "full") {
    return (
      <div className="flex items-center gap-1.5">
        <div
          className={`w-5 h-5 rounded-full flex items-center justify-center ${
            isRetaine
              ? "bg-[var(--m-teal)] text-white"
              : "bg-[var(--m-teal-light)] text-[var(--m-teal)]"
          }`}
        >
          <Check className="w-3 h-3" strokeWidth={3} />
        </div>
        <span
          className="text-xs text-[var(--m-slate)]"
          style={{ fontFamily: "var(--font-dm-sans)" }}
        >
          {indicator.label || "Yes"}
        </span>
      </div>
    );
  }

  if (indicator.type === "partial") {
    return (
      <div className="flex items-center gap-1.5">
        <div className="w-5 h-5 rounded-full flex items-center justify-center bg-gray-100">
          <div className="w-2.5 h-2.5 rounded-full border-2 border-gray-300 bg-gray-100 relative overflow-hidden">
            <div className="absolute inset-0 bg-gray-300" style={{ clipPath: "inset(0 50% 0 0)" }} />
          </div>
        </div>
        <span
          className="text-xs text-gray-400"
          style={{ fontFamily: "var(--font-dm-sans)" }}
        >
          {indicator.label || "Partial"}
        </span>
      </div>
    );
  }

  if (indicator.type === "na") {
    return (
      <div className="flex items-center gap-1.5">
        <Minus className="w-4 h-4 text-gray-300" />
        <span
          className="text-xs text-gray-300"
          style={{ fontFamily: "var(--font-dm-sans)" }}
        >
          {indicator.label || "N/A"}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <X className="w-4 h-4 text-gray-300" />
      <span
        className="text-xs text-gray-300"
        style={{ fontFamily: "var(--font-dm-sans)" }}
      >
        {indicator.label || "No"}
      </span>
    </div>
  );
}

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" as const },
  },
} as const;

export function CompetitorCards() {
  const competitors = COMPETITORS.filter((c) => !c.isRetaine);
  const retaine = COMPETITORS.find((c) => c.isRetaine)!;
  const [activeTab, setActiveTab] = useState(competitors[0].id);

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full flex overflow-x-auto gap-1 bg-[var(--m-off-white)] p-1 rounded-lg mb-4">
          {competitors.map((c) => (
            <TabsTrigger
              key={c.id}
              value={c.id}
              className="flex-1 text-xs whitespace-nowrap data-[state=active]:bg-white data-[state=active]:text-[var(--m-navy)] data-[state=active]:shadow-sm"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              {c.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {competitors.map((competitor) => (
          <TabsContent key={competitor.id} value={competitor.id}>
            <div className="space-y-1">
              {/* Header row */}
              <div className="grid grid-cols-[1fr_80px_80px] gap-2 px-3 py-2">
                <div />
                <div
                  className="text-center text-[10px] font-bold text-[var(--m-teal)]"
                  style={{ fontFamily: "var(--font-dm-sans)" }}
                >
                  {retaine.name}
                </div>
                <div
                  className="text-center text-[10px] font-medium text-[var(--m-slate)]"
                  style={{ fontFamily: "var(--font-dm-sans)" }}
                >
                  {competitor.name}
                </div>
              </div>

              {COMPARISON_MATRIX.map((row) => (
                <motion.div
                  key={row.feature.id}
                  variants={cardVariants}
                  className={`grid grid-cols-[1fr_80px_80px] gap-2 px-3 py-3 rounded-lg ${
                    row.feature.highlighted
                      ? "bg-[var(--m-teal-light)] border-l-2 border-l-[var(--m-teal)]"
                      : "bg-[var(--m-off-white)]"
                  }`}
                >
                  <div
                    className="text-xs font-medium text-[var(--m-navy)]"
                    style={{ fontFamily: "var(--font-dm-sans)" }}
                  >
                    {row.feature.label}
                  </div>
                  <div className="flex justify-center">
                    <MobileIndicator
                      indicator={row.indicators[retaine.id]}
                      isRetaine
                    />
                  </div>
                  <div className="flex justify-center">
                    <MobileIndicator
                      indicator={row.indicators[competitor.id]}
                      isRetaine={false}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </motion.div>
  );
}
