import Link from "next/link";

export function FinalCtaSection() {
  return (
    <section className="bg-[var(--m-navy)]">
      <div className="mx-auto max-w-[1200px] px-6 py-16 md:py-24 text-center">
        <h2
          className="text-3xl md:text-[40px] font-bold text-white mb-4"
          style={{ fontFamily: "var(--font-playfair)" }}
        >
          Stop leaving $150,000 on the table every year.
        </h2>
        <p
          className="text-base text-[var(--m-slate-light)] mb-8"
          style={{ fontFamily: "var(--font-dm-sans)" }}
        >
          Join the waitlist. Get early access. Or try the interactive demo right
          now.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
          <Link
            href="/request-demo"
            className="inline-flex items-center justify-center rounded-lg bg-[var(--m-teal)] px-8 py-3.5 text-base font-semibold text-white hover:bg-[var(--m-teal-mid)] hover:scale-[1.02] transition-all duration-150"
            style={{ fontFamily: "var(--font-dm-sans)" }}
          >
            Request a Demo &rarr;
          </Link>
          <Link
            href="/demo"
            className="inline-flex items-center justify-center rounded-lg border-2 border-[var(--m-teal)] px-8 py-3.5 text-base font-semibold text-white hover:bg-[var(--m-teal)]/10 hover:scale-[1.02] transition-all duration-150"
            style={{ fontFamily: "var(--font-dm-sans)" }}
          >
            Try the Interactive Demo
          </Link>
        </div>

        <div
          className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-[var(--m-slate-light)]"
          style={{ fontFamily: "var(--font-dm-sans)" }}
        >
          <span>&#x1F512; HIPAA Compliant</span>
          <span>&middot;</span>
          <span>No credit card required</span>
          <span>&middot;</span>
          <span>Cancel anytime</span>
        </div>
      </div>
    </section>
  );
}
