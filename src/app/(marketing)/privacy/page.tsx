import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "FollowDent privacy policy — how we collect, use, and protect your data.",
};

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl px-6 py-16 md:py-24">
      <h1
        className="text-3xl md:text-4xl font-bold text-[var(--m-navy)] mb-2"
        style={{ fontFamily: "var(--font-playfair)" }}
      >
        Privacy Policy
      </h1>
      <p
        className="text-sm text-[var(--m-slate-light)] mb-10"
        style={{ fontFamily: "var(--font-dm-sans)" }}
      >
        Last updated: January 2026
      </p>

      <div
        className="prose prose-slate max-w-none [&_h2]:font-bold [&_h2]:text-[var(--m-navy)] [&_h2]:text-xl [&_h2]:mt-10 [&_h2]:mb-4 [&_p]:text-[var(--m-slate)] [&_p]:leading-relaxed [&_p]:mb-4 [&_li]:text-[var(--m-slate)] [&_ul]:mb-4"
        style={{ fontFamily: "var(--font-dm-sans)" }}
      >
        <h2 style={{ fontFamily: "var(--font-playfair)" }}>1. Data We Collect</h2>
        <p>
          FollowDent collects information you provide directly, including your name, email address, practice name, role, phone number, and information about your practice management software. When you use our platform, we also collect treatment plan data synced from your PMS, patient contact information, message delivery and engagement data, and usage analytics.
        </p>

        <h2 style={{ fontFamily: "var(--font-playfair)" }}>2. How We Use Your Data</h2>
        <p>
          We use your information to provide and improve our treatment plan follow-up services, send automated patient communications on your behalf, generate analytics and revenue recovery reports, communicate with you about your account and our services, and ensure compliance with HIPAA and other applicable regulations.
        </p>

        <h2 style={{ fontFamily: "var(--font-playfair)" }}>3. HIPAA Compliance</h2>
        <p>
          FollowDent is designed to comply with the Health Insurance Portability and Accountability Act (HIPAA). We sign a Business Associate Agreement (BAA) with every customer practice. Protected Health Information (PHI) is encrypted at rest using AES-256 and in transit using TLS 1.2+. PHI is never included in outbound SMS or email messages — patients access treatment details only through secure, token-based portal links.
        </p>

        <h2 style={{ fontFamily: "var(--font-playfair)" }}>4. Third-Party Services</h2>
        <p>
          We use the following third-party services to deliver our platform:
        </p>
        <ul>
          <li><strong>Supabase</strong> — database hosting and authentication, with row-level security (RLS)</li>
          <li><strong>Twilio</strong> — SMS and voice message delivery</li>
          <li><strong>Brevo (Sendinblue)</strong> — email delivery and contact management</li>
          <li><strong>Vercel</strong> — application hosting</li>
          <li><strong>Anthropic (Claude)</strong> — AI-powered message generation</li>
        </ul>
        <p>All third-party vendors are vetted for HIPAA compliance where applicable, and BAAs are in place as required.</p>

        <h2 style={{ fontFamily: "var(--font-playfair)" }}>5. Data Retention & Deletion</h2>
        <p>
          We retain your data for as long as your account is active. Upon account termination, we will delete all associated data within 30 days unless a longer retention period is required by law. You may request deletion of your data at any time by contacting us.
        </p>

        <h2 style={{ fontFamily: "var(--font-playfair)" }}>6. Contact</h2>
        <p>
          For privacy-related inquiries, please contact us at{" "}
          <a href="mailto:privacy@followdent.com" className="text-[var(--m-teal)] hover:underline">
            privacy@followdent.com
          </a>.
        </p>
      </div>
    </article>
  );
}
