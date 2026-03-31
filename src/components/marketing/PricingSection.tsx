import Link from "next/link";
import { Check } from "lucide-react";

const features = [
  "Unlimited treatment plan sequences",
  "SMS, email + voicemail outreach",
  "Unified patient inbox",
  "PMS integration (Open Dental, Dentrix, Eaglesoft, CSV)",
  "HIPAA-compliant patient portal",
  "BAA provided",
  "Analytics & revenue tracking",
  "Unlimited team seats",
];

export function PricingSection() {
  return (
    <section id="pricing" className="bg-[var(--m-off-white)]">
      <div className="mx-auto max-w-[1200px] px-6 py-16 md:py-24">
        <div className="text-center mb-12">
          <h2
            className="text-3xl md:text-4xl font-bold text-[var(--m-navy)] mb-3"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            Simple, transparent pricing
          </h2>
          <p
            className="text-base text-[var(--m-slate)]"
            style={{ fontFamily: "var(--font-dm-sans)" }}
          >
            One practice. One price. No per-message fees, no seat limits.
          </p>
        </div>

        {/* Pricing card */}
        <div className="max-w-md mx-auto bg-white rounded-xl border border-[var(--m-border)] shadow-lg p-8">
          <h3
            className="text-lg font-bold text-[var(--m-navy)] mb-1"
            style={{ fontFamily: "var(--font-dm-sans)" }}
          >
            Pro Practice
          </h3>
          <div className="flex items-baseline gap-1 mb-6">
            <span
              className="text-4xl font-bold text-[var(--m-navy)]"
              style={{ fontFamily: "var(--font-dm-mono)" }}
            >
              $199
            </span>
            <span
              className="text-sm text-[var(--m-slate)]"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              / month per practice
            </span>
          </div>

          <ul className="space-y-3 mb-8">
            {features.map((feature) => (
              <li
                key={feature}
                className="flex items-start gap-2"
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                <Check className="w-4 h-4 text-[var(--m-teal)] mt-0.5 flex-shrink-0" />
                <span className="text-sm text-[var(--m-slate)]">{feature}</span>
              </li>
            ))}
          </ul>

          <Link
            href="/request-demo"
            className="block w-full rounded-lg bg-[var(--m-teal)] py-3 text-center text-base font-semibold text-white hover:bg-[var(--m-teal-mid)] hover:scale-[1.02] transition-all duration-150"
            style={{ fontFamily: "var(--font-dm-sans)" }}
          >
            Request a Demo — Launching Soon
          </Link>
        </div>

        <p
          className="mt-8 text-center text-sm text-[var(--m-slate)]"
          style={{ fontFamily: "var(--font-dm-sans)" }}
        >
          Questions about pricing? Email us at{" "}
          <a
            href="mailto:hello@followdent.com"
            className="text-[var(--m-teal)] font-semibold hover:underline"
          >
            hello@followdent.com
          </a>
        </p>
      </div>
    </section>
  );
}
