import Link from "next/link";

export function TestimonialSection() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-[800px] px-6 py-16 md:py-24 text-center">
        {/* Large quotation mark */}
        <span
          className="text-7xl leading-none text-[var(--m-teal)]/30 block mb-4"
          style={{ fontFamily: "var(--font-playfair)" }}
          aria-hidden
        >
          &ldquo;
        </span>

        <blockquote
          className="text-xl md:text-2xl italic text-[var(--m-navy)] leading-relaxed mb-6"
          style={{ fontFamily: "var(--font-playfair)" }}
        >
          We&apos;ve been in the pilot for 8 weeks. The sequences run themselves
          — our front desk doesn&apos;t think about it. We&apos;ve already
          recovered two implant cases we would have lost.
        </blockquote>

        <p
          className="text-sm text-[var(--m-slate)] mb-1"
          style={{ fontFamily: "var(--font-dm-sans)" }}
        >
          — Lead RDH, Pilot Practice (Denver, CO)
        </p>
        <p
          className="text-xs text-[var(--m-slate-light)] mb-8"
          style={{ fontFamily: "var(--font-dm-sans)" }}
        >
          Currently in private beta
        </p>

        <Link
          href="/request-demo"
          className="inline-flex items-center justify-center rounded-lg bg-[var(--m-teal-mid)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--m-teal)] hover:scale-[1.02] transition-all duration-150"
          style={{ fontFamily: "var(--font-dm-sans)" }}
        >
          Join them on the waitlist &rarr;
        </Link>
      </div>
    </section>
  );
}
