import { ShieldCheck, MessageSquareLock, Lock } from "lucide-react";
import Link from "next/link";

const cards = [
  {
    icon: ShieldCheck,
    title: "HIPAA Compliant",
    body: "All patient data is encrypted at rest and in transit. We sign a Business Associate Agreement (BAA) with every practice. PHI is never included in outbound messages — patients access treatment details only through secure, token-based portal links that expire after 72 hours.",
    badge: "BAA Provided",
  },
  {
    icon: MessageSquareLock,
    title: "TCPA-Safe Messaging",
    body: "Every SMS includes opt-out instructions per TCPA requirements. Our platform manages do-not-contact (DNC) lists automatically — patients can be flagged as DNC from the patient detail page or inbox. Patient consent is tracked and auditable.",
    badge: "Compliant Opt-Out",
  },
  {
    icon: Lock,
    title: "Enterprise-Grade Security",
    body: "Hosted on Supabase with row-level security (RLS) ensuring practices only ever see their own data. Portal tokens use SHA-256 hashing and single-use enforcement. All API routes are server-side only — no patient data exposed to the browser.",
    badge: "SOC 2 In Progress",
  },
];

export function ComplianceSection() {
  return (
    <section id="compliance" className="bg-[var(--m-teal-light)]">
      <div className="mx-auto max-w-[1200px] px-6 py-16 md:py-24">
        <div className="text-center mb-12">
          <span
            className="inline-block text-xs font-semibold uppercase tracking-widest text-[var(--m-teal)] mb-3"
            style={{ fontFamily: "var(--font-dm-sans)" }}
          >
            Security &amp; Compliance
          </span>
          <h2
            className="text-3xl md:text-4xl font-bold text-[var(--m-navy)]"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            Built for healthcare from day one
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {cards.map((card) => (
            <div
              key={card.title}
              className="bg-white rounded-xl border border-[var(--m-border)] p-6"
            >
              <card.icon className="w-8 h-8 text-[var(--m-teal)] mb-4" />
              <h3
                className="text-lg font-bold text-[var(--m-navy)] mb-2"
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                {card.title}
              </h3>
              <p
                className="text-sm text-[var(--m-slate)] leading-relaxed mb-4"
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                {card.body}
              </p>
              <span
                className="inline-block text-xs font-semibold text-[var(--m-teal)] bg-[var(--m-teal-light)] border border-[var(--m-teal)]/20 rounded-full px-3 py-1"
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                {card.badge}
              </span>
            </div>
          ))}
        </div>

        <p
          className="text-center text-sm"
          style={{ fontFamily: "var(--font-dm-sans)" }}
        >
          <Link
            href="/hipaa"
            className="text-[var(--m-teal)] font-semibold hover:underline"
          >
            Read our full HIPAA Compliance Statement &rarr;
          </Link>
        </p>
      </div>
    </section>
  );
}
