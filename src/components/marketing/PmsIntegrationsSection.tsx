import Link from "next/link";

const integrations = [
  {
    name: "Open Dental",
    detail: "Native API sync",
    sub: "Real-time",
    icon: "\uD83E\uDDB7",
  },
  {
    name: "Dentrix",
    detail: "Connector setup",
    sub: "(Dentrix G)",
    icon: "\uD83D\uDCCB",
  },
  {
    name: "Eaglesoft",
    detail: "Scheduled sync",
    sub: "+ webhook",
    icon: "\uD83D\uDCC1",
  },
  {
    name: "Manual / CSV",
    detail: "Any PMS via CSV",
    sub: "import",
    icon: "\uD83D\uDCE4",
  },
];

export function PmsIntegrationsSection() {
  return (
    <section id="integrations" className="bg-[var(--m-off-white)]">
      <div className="mx-auto max-w-[1200px] px-6 py-16 md:py-24">
        <div className="text-center mb-12">
          <span
            className="inline-block text-xs font-semibold uppercase tracking-widest text-[var(--m-teal)] mb-3"
            style={{ fontFamily: "var(--font-dm-sans)" }}
          >
            Integrations
          </span>
          <h2
            className="text-3xl md:text-4xl font-bold text-[var(--m-navy)]"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            Works with the PMS your practice already uses
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto mb-8">
          {integrations.map((item) => (
            <div
              key={item.name}
              className="bg-white rounded-xl border border-[var(--m-border)] border-l-[3px] border-l-[var(--m-navy)] p-6"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <h3
                    className="text-base font-bold text-[var(--m-navy)]"
                    style={{ fontFamily: "var(--font-dm-sans)" }}
                  >
                    {item.name}
                  </h3>
                  <p
                    className="text-sm text-[var(--m-slate)]"
                    style={{ fontFamily: "var(--font-dm-sans)" }}
                  >
                    {item.detail}
                  </p>
                  <p
                    className="text-xs text-[var(--m-slate-light)]"
                    style={{ fontFamily: "var(--font-dm-sans)" }}
                  >
                    {item.sub}
                  </p>
                  <span
                    className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-[var(--m-teal)]"
                    style={{ fontFamily: "var(--font-dm-sans)" }}
                  >
                    &#10003; Supported
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p
          className="text-center text-sm text-[var(--m-slate)]"
          style={{ fontFamily: "var(--font-dm-sans)" }}
        >
          Don&apos;t see your PMS? We&apos;re adding new integrations monthly.{" "}
          <Link
            href="/request-demo"
            className="text-[var(--m-teal)] font-semibold hover:underline"
          >
            Tell us what you use &rarr;
          </Link>
        </p>
      </div>
    </section>
  );
}
