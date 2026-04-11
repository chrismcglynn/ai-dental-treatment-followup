"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";

interface FlowNode {
  id: string;
  label: string;
  sublabel?: string;
  x: number;
  y: number;
  type: "start" | "process" | "decision" | "safe" | "escalate";
  delay: number; // stagger index
}

interface FlowEdge {
  from: string;
  to: string;
  label?: string;
  delay: number;
  path: string; // SVG path d
}

const NODES: FlowNode[] = [
  { id: "patient", label: "Patient replies", sublabel: "via SMS", x: 180, y: 30, type: "start", delay: 0 },
  { id: "classify", label: "AI classifies intent", sublabel: "< 2 seconds", x: 180, y: 110, type: "process", delay: 1 },
  { id: "check", label: "Safe to\nauto-reply?", x: 180, y: 200, type: "decision", delay: 2 },
  { id: "auto", label: "AI auto-replies", sublabel: "30s natural delay", x: 60, y: 300, type: "safe", delay: 3 },
  { id: "escalate", label: "Escalate to staff", sublabel: "with context", x: 300, y: 300, type: "escalate", delay: 3 },
];

const EDGES: FlowEdge[] = [
  { from: "patient", to: "classify", delay: 0.5, path: "M180,55 L180,90" },
  { from: "classify", to: "check", delay: 1.5, path: "M180,135 L180,175" },
  { from: "check", to: "auto", label: "Yes", delay: 2.5, path: "M145,210 L80,210 L80,280" },
  { from: "check", to: "escalate", label: "No", delay: 2.5, path: "M215,210 L280,210 L280,280" },
];

const SAFE_EXAMPLES = [
  '"not ready yet"',
  '"thanks, will call later"',
  '"sounds good"',
];

const ESCALATE_EXAMPLES = [
  "Clinical concerns",
  "Insurance questions",
  "Scheduling requests",
  "Low AI confidence",
  "Reply limit reached",
];

const nodeColors = {
  start: { bg: "var(--m-off-white)", border: "var(--m-border)", text: "var(--m-navy)" },
  process: { bg: "var(--m-teal-light)", border: "var(--m-teal)", text: "var(--m-teal)" },
  decision: { bg: "#fefce8", border: "#facc15", text: "var(--m-navy)" },
  safe: { bg: "#ecfdf5", border: "#10b981", text: "#065f46" },
  escalate: { bg: "#fffbeb", border: "#f59e0b", text: "#92400e" },
};

function NodeShape({ node, visible }: { node: FlowNode; visible: boolean }) {
  const colors = nodeColors[node.type];
  const lines = node.label.split("\n");

  if (node.type === "decision") {
    // Diamond shape
    return (
      <motion.g
        initial={{ opacity: 0, scale: 0.7 }}
        animate={visible ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.4, delay: node.delay * 0.5 }}
      >
        <polygon
          points={`${node.x},${node.y - 25} ${node.x + 35},${node.y} ${node.x},${node.y + 25} ${node.x - 35},${node.y}`}
          fill={colors.bg}
          stroke={colors.border}
          strokeWidth="1.5"
        />
        {lines.map((line, i) => (
          <text
            key={i}
            x={node.x}
            y={node.y + (i - (lines.length - 1) / 2) * 11}
            textAnchor="middle"
            dominantBaseline="central"
            fill={colors.text}
            fontSize="8"
            fontWeight="600"
            fontFamily="var(--font-dm-sans)"
          >
            {line}
          </text>
        ))}
      </motion.g>
    );
  }

  const width = node.type === "start" ? 130 : 120;
  const height = node.sublabel ? 40 : 30;

  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.7 }}
      animate={visible ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.4, delay: node.delay * 0.5 }}
    >
      <rect
        x={node.x - width / 2}
        y={node.y - height / 2}
        width={width}
        height={height}
        rx={node.type === "start" ? 15 : 8}
        fill={colors.bg}
        stroke={colors.border}
        strokeWidth="1.5"
      />
      <text
        x={node.x}
        y={node.sublabel ? node.y - 5 : node.y}
        textAnchor="middle"
        dominantBaseline="central"
        fill={colors.text}
        fontSize="9"
        fontWeight="600"
        fontFamily="var(--font-dm-sans)"
      >
        {node.label}
      </text>
      {node.sublabel && (
        <text
          x={node.x}
          y={node.y + 9}
          textAnchor="middle"
          dominantBaseline="central"
          fill={colors.text}
          fontSize="7"
          fontWeight="400"
          fontFamily="var(--font-dm-sans)"
          opacity={0.7}
        >
          {node.sublabel}
        </text>
      )}
    </motion.g>
  );
}

export function EscalationFlowMockup() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const maxDelay = Math.max(...NODES.map((n) => n.delay), ...EDGES.map((e) => e.delay));
    let current = 0;
    const interval = setInterval(() => {
      current++;
      setStep(current);
      if (current > maxDelay + 2) clearInterval(interval);
    }, 500);
    return () => clearInterval(interval);
  }, [isInView]);

  return (
    <div ref={ref} className="max-w-md w-full">
      <div className="rounded-xl border border-[var(--m-border)] bg-white shadow-lg overflow-hidden">
        {/* Flowchart */}
        <div className="p-4 pb-2">
          <svg viewBox="0 0 360 340" className="w-full" aria-label="AI escalation decision flow">
            {/* Edges */}
            {EDGES.map((edge) => (
              <g key={`${edge.from}-${edge.to}`}>
                <motion.path
                  d={edge.path}
                  fill="none"
                  stroke="var(--m-slate-light)"
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={step >= edge.delay * 2 ? { pathLength: 1, opacity: 1 } : {}}
                  transition={{ duration: 0.5 }}
                />
                {edge.label && (
                  <motion.text
                    x={edge.to === "auto" ? 100 : 260}
                    y={205}
                    textAnchor="middle"
                    fill={edge.to === "auto" ? "#10b981" : "#f59e0b"}
                    fontSize="9"
                    fontWeight="700"
                    fontFamily="var(--font-dm-sans)"
                    initial={{ opacity: 0 }}
                    animate={step >= edge.delay * 2 ? { opacity: 1 } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    {edge.label}
                  </motion.text>
                )}
              </g>
            ))}

            {/* Arrow markers at end of paths */}
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--m-slate-light)" />
              </marker>
            </defs>

            {/* Nodes */}
            {NODES.map((node) => (
              <NodeShape key={node.id} node={node} visible={step >= node.delay} />
            ))}
          </svg>
        </div>

        {/* Example triggers */}
        <motion.div
          className="px-4 pb-4"
          initial={{ opacity: 0 }}
          animate={step >= 6 ? { opacity: 1 } : {}}
          transition={{ duration: 0.5 }}
        >
          <div className="grid grid-cols-2 gap-3">
            {/* Safe column */}
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2.5">
              <div
                className="text-[9px] font-bold text-emerald-700 mb-1.5 flex items-center gap-1"
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Auto-reply handles
              </div>
              <div className="space-y-1">
                {SAFE_EXAMPLES.map((ex) => (
                  <div
                    key={ex}
                    className="text-[9px] text-emerald-800 italic"
                    style={{ fontFamily: "var(--font-dm-sans)" }}
                  >
                    {ex}
                  </div>
                ))}
              </div>
            </div>

            {/* Escalate column */}
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-2.5">
              <div
                className="text-[9px] font-bold text-amber-700 mb-1.5 flex items-center gap-1"
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Escalated to you
              </div>
              <div className="space-y-1">
                {ESCALATE_EXAMPLES.map((ex) => (
                  <div
                    key={ex}
                    className="text-[9px] text-amber-800"
                    style={{ fontFamily: "var(--font-dm-sans)" }}
                  >
                    {ex}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
