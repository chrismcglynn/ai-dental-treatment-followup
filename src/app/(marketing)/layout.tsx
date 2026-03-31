import type { Metadata } from "next";
import { playfairDisplay, dmSans, dmMono, dmSerif } from "@/lib/fonts";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://Retaine.com"
  ),
  title: {
    default: "Retaine — AI Treatment Plan Follow-Up for Dental Practices",
    template: "%s | Retaine",
  },
  description:
    "Retaine automatically follows up with patients who have unscheduled treatment plans via SMS, email, and voicemail. Average practices recover $150,000+ per year. HIPAA compliant.",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Retaine",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`min-h-screen bg-[var(--m-off-white)] ${playfairDisplay.variable} ${dmSans.variable} ${dmMono.variable} ${dmSerif.variable}`}
    >
      <MarketingNav />
      <main>{children}</main>
      <MarketingFooter />
    </div>
  );
}
