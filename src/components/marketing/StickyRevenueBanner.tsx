"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, DollarSign } from "lucide-react";
import Link from "next/link";

export function StickyRevenueBanner() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;

    let scrollTriggered = false;
    let timerTriggered = false;

    const show = () => {
      if (!dismissed) setVisible(true);
    };

    // Show after 10s on page
    const timer = setTimeout(() => {
      timerTriggered = true;
      show();
    }, 10000);

    // Or show after scrolling past the comparison section
    const onScroll = () => {
      if (scrollTriggered) return;
      const comparison = document.getElementById("comparison");
      if (comparison) {
        const rect = comparison.getBoundingClientRect();
        if (rect.bottom < 0) {
          scrollTriggered = true;
          show();
        }
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    };
  }, [dismissed]);

  const handleDismiss = () => {
    setDismissed(true);
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && !dismissed && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="fixed bottom-0 left-0 right-0 z-50"
        >
          <div className="bg-[var(--m-navy)] border-t border-[var(--m-teal)]/30 shadow-[0_-4px_24px_rgba(0,0,0,0.15)]">
            <div className="mx-auto max-w-[1200px] px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3 sm:gap-5">
              {/* Icon */}
              <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--m-teal)]/15">
                <DollarSign className="h-5 w-5 text-[var(--m-teal)]" />
              </div>

              {/* Copy */}
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm sm:text-base font-semibold text-white"
                  style={{ fontFamily: "var(--font-dm-sans)" }}
                >
                  Practices like yours have{" "}
                  <span
                    className="text-[var(--m-teal)]"
                    style={{ fontFamily: "var(--font-dm-mono)" }}
                  >
                    $28,400+
                  </span>{" "}
                  in unscheduled treatment plans
                </p>
                <p
                  className="text-xs text-white/60 hidden sm:block"
                  style={{ fontFamily: "var(--font-dm-sans)" }}
                >
                  See how much revenue Retaine can recover for your practice
                </p>
              </div>

              {/* CTA */}
              <Link
                href="/request-demo"
                onClick={handleDismiss}
                className="shrink-0 inline-flex items-center justify-center rounded-lg bg-[var(--m-teal-mid)] px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-[var(--m-teal)] transition-colors"
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                See yours →
              </Link>

              {/* Dismiss */}
              <button
                onClick={handleDismiss}
                className="shrink-0 p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors"
                aria-label="Dismiss banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
