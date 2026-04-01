import { ClipboardCheck, MessageSquare, CalendarCheck } from "lucide-react";

const steps = [
  {
    icon: ClipboardCheck,
    title: "Treatment plan detected",
    body: "Retaine syncs with your PMS and instantly identifies every accepted treatment plan that hasn't been scheduled. AI matches each plan to the best follow-up sequence automatically.",
  },
  {
    icon: MessageSquare,
    title: "AI-powered multi-channel outreach",
    body: "AI generates personalized SMS, email, and voicemail messages tailored to each procedure and patient. When patients reply, AI classifies their intent and drafts a response — your team just clicks send.",
  },
  {
    icon: CalendarCheck,
    title: "Patient books. Revenue recovered.",
    body: "Patients reply, click a secure booking link, or call in. AI detects booking intent and flags conversions automatically. You track every dollar recovered in real time. Average conversion: 34%.",
  },
];

export function SolutionSection() {
  return (
    <section id="solution" className="bg-[var(--m-teal-light)]">
      <div className="mx-auto max-w-[1200px] px-6 py-16 md:py-24">
        <div className="text-center mb-12">
          <span
            className="inline-block text-xs font-semibold uppercase tracking-widest text-[var(--m-teal)] mb-3"
            style={{ fontFamily: "var(--font-dm-sans)" }}
          >
            How Retaine Works
          </span>
          <h2
            className="text-3xl md:text-4xl font-bold text-[var(--m-navy)]"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            Intelligent follow-up that works while your team focuses on patients
          </h2>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 items-start mb-12">
          {steps.map((step, i) => (
            <div key={step.title} className="flex items-start">
              <div className="flex-1 text-center px-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white border-2 border-[var(--m-teal)] mb-4">
                  <step.icon className="w-6 h-6 text-[var(--m-teal)]" />
                </div>
                <div
                  className="text-xs font-semibold text-[var(--m-teal)] uppercase tracking-wider mb-2"
                  style={{ fontFamily: "var(--font-dm-sans)" }}
                >
                  Step {i + 1}
                </div>
                <h3
                  className="text-lg font-bold text-[var(--m-navy)] mb-2"
                  style={{ fontFamily: "var(--font-playfair)" }}
                >
                  {step.title}
                </h3>
                <p
                  className="text-sm text-[var(--m-slate)] leading-relaxed"
                  style={{ fontFamily: "var(--font-dm-sans)" }}
                >
                  {step.body}
                </p>
              </div>
              {i < steps.length - 1 && (
                <div className="hidden md:flex items-center self-center pt-4">
                  <div className="w-8 h-0.5 bg-[var(--m-teal)]" />
                  <div className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[8px] border-l-[var(--m-teal)]" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ROI callout */}
        <div className="rounded-xl border-2 border-[var(--m-teal)] bg-white/60 px-6 py-4 text-center max-w-2xl mx-auto">
          <p
            className="text-sm text-[var(--m-navy)] font-medium"
            style={{ fontFamily: "var(--font-dm-sans)" }}
          >
            Average practices recover{" "}
            <span
              className="font-bold text-[var(--m-amber)]"
              style={{ fontFamily: "var(--font-dm-mono)" }}
            >
              $150,000 – $300,000
            </span>{" "}
            per year. At $199/month, that&apos;s a{" "}
            <span className="font-bold">75–125&times; ROI</span>.
          </p>
        </div>
      </div>
    </section>
  );
}
