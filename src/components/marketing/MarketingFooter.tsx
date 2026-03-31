import Link from "next/link";

export function MarketingFooter() {
  return (
    <footer className="bg-[var(--m-navy-deep)] text-white">
      <div className="mx-auto max-w-[1200px] px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Left column */}
          <div>
            <span
              className="text-xl font-bold"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              FollowDent
            </span>
            <p
              className="mt-3 text-sm text-[var(--m-slate-light)] leading-relaxed"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              AI-powered treatment plan follow-up for dental practices.
            </p>
            <p
              className="mt-4 text-xs text-[var(--m-slate-light)]"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              HIPAA Compliant · SOC 2 In Progress
            </p>
          </div>

          {/* Center column */}
          <div>
            <h4
              className="text-sm font-semibold uppercase tracking-wider text-[var(--m-slate-light)] mb-4"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              Links
            </h4>
            <nav className="flex flex-col gap-3">
              {[
                { label: "How it Works", href: "#how-it-works" },
                { label: "Integrations", href: "#integrations" },
                { label: "Pricing", href: "#pricing" },
                { label: "Privacy Policy", href: "/privacy" },
                { label: "HIPAA Statement", href: "/hipaa" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-gray-300 hover:text-white transition-colors"
                  style={{ fontFamily: "var(--font-dm-sans)" }}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right column */}
          <div>
            <h4
              className="text-sm font-semibold uppercase tracking-wider text-[var(--m-slate-light)] mb-4"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              Ready to recover lost revenue?
            </h4>
            <Link
              href="/request-demo"
              className="inline-flex items-center justify-center rounded-lg border-2 border-[var(--m-teal)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--m-teal)] transition-colors"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              Request a Demo
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div
          className="mx-auto max-w-[1200px] px-6 py-4 text-center text-xs text-[var(--m-slate-light)]"
          style={{ fontFamily: "var(--font-dm-sans)" }}
        >
          &copy; 2026 FollowDent · All rights reserved · Denver, CO
        </div>
      </div>
    </footer>
  );
}
