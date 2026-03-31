import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { DemoRequestForm } from "@/components/marketing/DemoRequestForm";

export const metadata: Metadata = {
  title: "Request a Demo — See Retaine in Action",
  description:
    "Join the Retaine waitlist and get a personalized demo. See how AI-powered treatment plan follow-up recovers unscheduled revenue for dental practices.",
};

export default function RequestDemoPage() {
  return (
    <section className="min-h-[calc(100vh-80px)]">
      <div className="grid grid-cols-1 lg:grid-cols-5">
        {/* Left column — value reinforcement */}
        <div className="lg:col-span-2 bg-[var(--m-teal-mid)] text-white px-8 py-12 lg:py-20 lg:px-12">
          <h2
            className="text-2xl font-bold mb-6"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            Retaine is launching soon.
          </h2>

          <div className="mb-8" style={{ fontFamily: "var(--font-dm-sans)" }}>
            <p className="text-sm font-semibold mb-3">
              Join the waitlist and get:
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span>&#10003;</span> Priority access when we launch
              </li>
              <li className="flex items-center gap-2">
                <span>&#10003;</span> A personalized interactive demo
              </li>
              <li className="flex items-center gap-2">
                <span>&#10003;</span> Pilot pricing (first 2 months free)
              </li>
            </ul>
          </div>

          {/* Quote */}
          <blockquote className="mb-8 border-l-2 border-white/30 pl-4">
            <p
              className="text-sm italic leading-relaxed"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              &ldquo;We&apos;ve already recovered two implant cases we would
              have lost.&rdquo;
            </p>
            <footer
              className="text-xs mt-2 text-white/70"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              — Lead RDH, Denver CO pilot practice
            </footer>
          </blockquote>

          {/* Market stat */}
          <div className="rounded-lg border border-white/20 px-5 py-4 mb-8">
            <p
              className="text-2xl font-bold mb-1"
              style={{ fontFamily: "var(--font-dm-mono)" }}
            >
              178,000
            </p>
            <p
              className="text-sm leading-relaxed text-white/80"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              dental practices leave{" "}
              <strong className="text-white">$89.1 billion</strong> in
              unscheduled treatment revenue every year.
            </p>
            <p
              className="text-sm font-semibold mt-2"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              Your practice doesn&apos;t have to be one of them.
            </p>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-4 text-xs text-white/70" style={{ fontFamily: "var(--font-dm-sans)" }}>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" /> HIPAA Compliant
            </span>
            <span>Open Dental</span>
            <span>Dentrix</span>
          </div>
        </div>

        {/* Right column — form */}
        <div className="lg:col-span-3 px-6 py-12 lg:py-20 lg:px-16">
          <div className="max-w-lg mx-auto">
            <h1
              className="text-2xl md:text-3xl font-bold text-[var(--m-navy)] mb-2"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              See Retaine in action
            </h1>
            <p
              className="text-sm text-[var(--m-slate)] mb-8"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              We&apos;re in private beta. Fill out the form below and
              we&apos;ll be in touch within 1 business day to schedule your
              personalized interactive demo.
            </p>

            <DemoRequestForm />
          </div>
        </div>
      </div>
    </section>
  );
}
