import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "HIPAA Compliance Statement",
  description: "Retaine HIPAA compliance statement — how we protect patient data and ensure regulatory compliance.",
};

export default function HipaaPage() {
  return (
    <article className="mx-auto max-w-3xl px-6 py-16 md:py-24">
      <h1
        className="text-3xl md:text-4xl font-bold text-[var(--m-navy)] mb-2"
        style={{ fontFamily: "var(--font-playfair)" }}
      >
        HIPAA Compliance Statement
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
        <p>
          Retaine is committed to protecting the privacy and security of Protected Health Information (PHI) in compliance with the Health Insurance Portability and Accountability Act of 1996 (HIPAA) and its implementing regulations.
        </p>

        <h2 style={{ fontFamily: "var(--font-playfair)" }}>Business Associate Agreements</h2>
        <p>
          Retaine acts as a Business Associate under HIPAA. We execute a Business Associate Agreement (BAA) with every customer practice before any PHI is processed. Our BAA outlines our obligations regarding PHI use, disclosure, and protection.
        </p>

        <h2 style={{ fontFamily: "var(--font-playfair)" }}>PHI Handling Practices</h2>
        <p>
          PHI is never included in outbound SMS, email, or voicemail messages. All patient communications contain only general reminders and secure links. Treatment plan details are accessible only through our HIPAA-compliant patient portal, which uses single-use, time-limited tokens. Portal links expire after 72 hours and cannot be reused.
        </p>

        <h2 style={{ fontFamily: "var(--font-playfair)" }}>Encryption</h2>
        <ul>
          <li><strong>At rest:</strong> All data is encrypted using AES-256 encryption</li>
          <li><strong>In transit:</strong> All communications use TLS 1.2 or higher</li>
          <li><strong>Portal tokens:</strong> SHA-256 hashing with single-use enforcement</li>
        </ul>

        <h2 style={{ fontFamily: "var(--font-playfair)" }}>Access Controls</h2>
        <ul>
          <li><strong>Row-Level Security (RLS):</strong> Enforced at the database level via Supabase, ensuring practices can only access their own data</li>
          <li><strong>Role-based access:</strong> Team members receive permissions appropriate to their role (admin, manager, staff)</li>
          <li><strong>Audit logging:</strong> All data access and modifications are logged for compliance review</li>
          <li><strong>Server-side only:</strong> All API routes that handle PHI execute server-side — no patient data is exposed to the browser</li>
        </ul>

        <h2 style={{ fontFamily: "var(--font-playfair)" }}>Data Retention & Deletion</h2>
        <p>
          Patient data is retained for the duration of the customer relationship. Upon account termination, all PHI is permanently deleted within 30 days. Practices may request immediate deletion of specific patient records at any time. Automated data purge procedures ensure no PHI persists beyond the retention period.
        </p>

        <h2 style={{ fontFamily: "var(--font-playfair)" }}>Requesting a BAA</h2>
        <p>
          To request a Business Associate Agreement or for any HIPAA-related inquiries, please contact our privacy team at{" "}
          <a href="mailto:privacy@retaine.com" className="text-[var(--m-teal)] hover:underline">
            privacy@retaine.com
          </a>.
        </p>

        <div className="mt-10 rounded-xl border border-[var(--m-border)] bg-[var(--m-teal-light)] p-6 text-center">
          <p className="text-sm text-[var(--m-navy)] font-medium mb-3">
            Have questions about our security practices?
          </p>
          <Link
            href="/request-demo"
            className="inline-flex items-center justify-center rounded-lg bg-[var(--m-teal-mid)] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[var(--m-teal)] transition-colors"
          >
            Request a Demo &rarr;
          </Link>
        </div>
      </div>
    </article>
  );
}
