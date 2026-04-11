"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";

interface ChatMessage {
  id: number;
  direction: "outbound" | "inbound";
  body: string;
  sentBy?: "ai_auto" | "staff";
  delay: number; // ms after previous message
}

interface ChatEvent {
  id: string;
  type: "intent_badge" | "escalation" | "typing";
  label: string;
  delay: number;
  variant?: "safe" | "escalated";
}

type TimelineItem =
  | { kind: "message"; data: ChatMessage }
  | { kind: "event"; data: ChatEvent };

const TIMELINE: TimelineItem[] = [
  {
    kind: "message",
    data: {
      id: 1,
      direction: "outbound",
      body: "Hi Maria, just checking in about your crown. Would you like to get that scheduled?",
      sentBy: "ai_auto",
      delay: 600,
    },
  },
  {
    kind: "event",
    data: { id: "typing-1", type: "typing", label: "", delay: 800 },
  },
  {
    kind: "message",
    data: {
      id: 2,
      direction: "inbound",
      body: "not ready yet, maybe next month",
      delay: 400,
    },
  },
  {
    kind: "event",
    data: {
      id: "intent-1",
      type: "intent_badge",
      label: "Not ready",
      delay: 500,
      variant: "safe",
    },
  },
  {
    kind: "event",
    data: { id: "typing-2", type: "typing", label: "", delay: 600 },
  },
  {
    kind: "message",
    data: {
      id: 3,
      direction: "outbound",
      body: "No problem at all! We\u2019ll check back in a few weeks. Call us anytime you\u2019re ready.",
      sentBy: "ai_auto",
      delay: 400,
    },
  },
  {
    kind: "event",
    data: { id: "typing-3", type: "typing", label: "", delay: 1200 },
  },
  {
    kind: "message",
    data: {
      id: 4,
      direction: "inbound",
      body: "actually, how much will this cost with my insurance?",
      delay: 400,
    },
  },
  {
    kind: "event",
    data: {
      id: "escalation-1",
      type: "escalation",
      label: "Patient asking about cost/insurance",
      delay: 600,
      variant: "escalated",
    },
  },
];

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-[var(--m-slate-light)]"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  );
}

function BotBadge() {
  return (
    <span
      className="inline-flex items-center gap-0.5 text-[8px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700"
      style={{ fontFamily: "var(--font-dm-sans)" }}
    >
      <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <rect x="3" y="11" width="18" height="10" rx="2" />
        <circle cx="12" cy="5" r="3" />
        <line x1="12" y1="8" x2="12" y2="11" />
        <circle cx="8" cy="16" r="1" fill="currentColor" />
        <circle cx="16" cy="16" r="1" fill="currentColor" />
      </svg>
      AI Auto-Reply
    </span>
  );
}

export function AnimatedConversationMockup() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [visibleItems, setVisibleItems] = useState<number>(0);
  const [showTyping, setShowTyping] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (!isInView || hasStarted) return;
    setHasStarted(true);

    let itemIndex = 0;
    const advance = () => {
      if (itemIndex >= TIMELINE.length) return;

      const item = TIMELINE[itemIndex];

      if (item.kind === "event" && item.data.type === "typing") {
        setShowTyping(true);
        itemIndex++;
        setTimeout(() => {
          setShowTyping(false);
          advance();
        }, item.data.delay);
      } else {
        setVisibleItems((prev) => prev + 1);
        itemIndex++;
        if (itemIndex < TIMELINE.length) {
          setTimeout(advance, TIMELINE[itemIndex - 1].kind === "message"
            ? TIMELINE[itemIndex].kind === "message" ? TIMELINE[itemIndex].data.delay : TIMELINE[itemIndex].data.delay
            : TIMELINE[itemIndex].data.delay
          );
        }
      }
    };

    setTimeout(advance, 800);
  }, [isInView, hasStarted]);

  // Filter out typing events for rendering
  const renderItems = TIMELINE.filter(
    (item) => !(item.kind === "event" && item.data.type === "typing")
  );

  return (
    <div ref={ref} className="rounded-xl border border-[var(--m-border)] bg-white shadow-lg overflow-hidden max-w-sm w-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--m-border)] bg-[var(--m-off-white)]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[var(--m-teal-light)] flex items-center justify-center">
            <span
              className="text-[10px] font-bold text-[var(--m-teal)]"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              MC
            </span>
          </div>
          <div>
            <div
              className="text-[11px] font-semibold text-[var(--m-navy)]"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              Maria C. — Crown #14
            </div>
          </div>
        </div>
        <AnimatePresence>
          {visibleItems >= 3 && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-[8px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              AI Handling
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Escalation banner */}
      <AnimatePresence>
        {visibleItems >= renderItems.length && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-2 px-4 py-2 bg-amber-50 border-b border-amber-200"
          >
            <svg className="w-3.5 h-3.5 text-amber-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="11" width="18" height="10" rx="2" />
              <circle cx="12" cy="5" r="3" />
              <line x1="12" y1="8" x2="12" y2="11" />
            </svg>
            <span
              className="text-[10px] text-amber-800"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              AI escalated: Patient asking about cost/insurance
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages area */}
      <div className="p-3 space-y-2 min-h-[220px]">
        <AnimatePresence>
          {renderItems.slice(0, visibleItems).map((item, i) => {
            if (item.kind === "message") {
              const msg = item.data;
              const isOutbound = msg.direction === "outbound";
              return (
                <motion.div
                  key={`msg-${msg.id}`}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${isOutbound ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`rounded-xl px-3 py-2 max-w-[85%] ${
                      isOutbound
                        ? "bg-[var(--m-teal-light)] border border-[var(--m-teal)]/10"
                        : "bg-[var(--m-off-white)]"
                    }`}
                  >
                    {msg.sentBy === "ai_auto" && (
                      <div className="mb-1">
                        <BotBadge />
                      </div>
                    )}
                    <p
                      className={`text-[11px] leading-snug ${
                        isOutbound ? "text-[var(--m-slate)]" : "text-[var(--m-navy)]"
                      }`}
                      style={{ fontFamily: "var(--font-dm-sans)" }}
                    >
                      {msg.body}
                    </p>
                  </div>
                </motion.div>
              );
            }

            if (item.kind === "event" && item.data.type === "intent_badge") {
              return (
                <motion.div
                  key={item.data.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25 }}
                  className="flex justify-center"
                >
                  <span
                    className="inline-flex items-center gap-1 text-[9px] font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-200"
                    style={{ fontFamily: "var(--font-dm-sans)" }}
                  >
                    <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    AI classified: {item.data.label}
                  </span>
                </motion.div>
              );
            }

            if (item.kind === "event" && item.data.type === "escalation") {
              return (
                <motion.div
                  key={item.data.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25 }}
                  className="flex justify-center"
                >
                  <span
                    className="inline-flex items-center gap-1 text-[9px] font-medium px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200"
                    style={{ fontFamily: "var(--font-dm-sans)" }}
                  >
                    <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    Escalated to front desk
                  </span>
                </motion.div>
              );
            }

            return null;
          })}
        </AnimatePresence>

        {/* Typing indicator */}
        <AnimatePresence>
          {showTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-start"
            >
              <div className="rounded-xl bg-[var(--m-off-white)] px-1 py-0.5">
                <TypingIndicator />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-3 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-lg border border-[var(--m-border)] px-3 py-1.5">
            <span
              className="text-[10px] text-[var(--m-slate-light)]"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              Type a reply...
            </span>
          </div>
          <button className="rounded-lg bg-[var(--m-teal)] px-2.5 py-1.5 text-[9px] font-semibold text-white">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
