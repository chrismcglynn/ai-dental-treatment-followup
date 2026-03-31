"use client";

import { useState } from "react";
import { z } from "zod";

const formSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Please enter a valid email"),
  role: z.string().min(1, "Please select your role"),
  practiceName: z.string().min(1, "Practice name is required"),
  phone: z.string().optional(),
  currentPms: z.string().min(1, "Please select your PMS"),
  plansPerMonth: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;
type FieldErrors = Partial<Record<keyof FormData, string>>;

const roles = [
  "Practice Owner",
  "Office Manager",
  "Lead RDH",
  "Associate Dentist",
  "Other",
];

const pmsList = [
  "Open Dental",
  "Dentrix",
  "Eaglesoft",
  "Carestream Dental",
  "Curve Dental",
  "Patterson Dental (other)",
  "None",
  "Other",
];

const planRanges = ["Under 20", "20–50", "50–100", "100+", "Not sure"];

export function DemoRequestForm() {
  const [form, setForm] = useState<FormData>({
    fullName: "",
    email: "",
    role: "",
    practiceName: "",
    phone: "",
    currentPms: "",
    plansPerMonth: "",
    notes: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [apiError, setApiError] = useState("");

  function update(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError("");

    const result = formSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof FormData;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/demo-request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(result.data),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Submission failed");
      }

      setSubmitted(true);
    } catch (err) {
      setApiError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[var(--m-teal-light)] mb-4">
          <span className="text-2xl text-[var(--m-teal)]">&#10003;</span>
        </div>
        <h3
          className="text-xl font-bold text-[var(--m-navy)] mb-2"
          style={{ fontFamily: "var(--font-playfair)" }}
        >
          You&apos;re on the waitlist!
        </h3>
        <p
          className="text-sm text-[var(--m-slate)] mb-6"
          style={{ fontFamily: "var(--font-dm-sans)" }}
        >
          We&apos;ll be in touch at{" "}
          <strong className="text-[var(--m-navy)]">{form.email}</strong> within
          1 business day to schedule your demo.
        </p>
        <p
          className="text-sm text-[var(--m-slate)] mb-4"
          style={{ fontFamily: "var(--font-dm-sans)" }}
        >
          In the meantime, explore our interactive sandbox demo — no signup
          required:
        </p>
      </div>
    );
  }

  const inputClass =
    "w-full rounded-lg border border-[var(--m-border)] bg-white px-4 py-2.5 text-sm text-[var(--m-navy)] placeholder:text-[var(--m-slate-light)] focus:outline-none focus:border-[var(--m-teal)] transition-colors";
  const selectClass =
    "w-full rounded-lg border border-[var(--m-border)] px-4 py-2.5 text-sm text-[var(--m-navy)] focus:outline-none focus:border-[var(--m-teal)] transition-colors bg-white";
  const labelClass = "block text-sm font-medium text-[var(--m-navy)] mb-1.5";
  const errorClass = "text-xs text-[var(--m-red-soft)] mt-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-5" style={{ fontFamily: "var(--font-dm-sans)" }}>
      <div>
        <label className={labelClass}>
          Full Name <span className="text-[var(--m-red-soft)]">*</span>
        </label>
        <input
          type="text"
          className={inputClass}
          value={form.fullName}
          onChange={(e) => update("fullName", e.target.value)}
          placeholder="Dr. Jane Smith"
        />
        {errors.fullName && <p className={errorClass}>{errors.fullName}</p>}
      </div>

      <div>
        <label className={labelClass}>
          Role / Title <span className="text-[var(--m-red-soft)]">*</span>
        </label>
        <select
          className={selectClass}
          value={form.role}
          onChange={(e) => update("role", e.target.value)}
        >
          <option value="">Select your role</option>
          {roles.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        {errors.role && <p className={errorClass}>{errors.role}</p>}
      </div>

      <div>
        <label className={labelClass}>
          Practice Name <span className="text-[var(--m-red-soft)]">*</span>
        </label>
        <input
          type="text"
          className={inputClass}
          value={form.practiceName}
          onChange={(e) => update("practiceName", e.target.value)}
          placeholder="Smile Dental Group"
        />
        {errors.practiceName && (
          <p className={errorClass}>{errors.practiceName}</p>
        )}
      </div>

      <div>
        <label className={labelClass}>
          Best Email Address <span className="text-[var(--m-red-soft)]">*</span>
        </label>
        <input
          type="email"
          className={inputClass}
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          placeholder="jane@smiledental.com"
        />
        {errors.email && <p className={errorClass}>{errors.email}</p>}
      </div>

      <div>
        <label className={labelClass}>Practice Phone (optional)</label>
        <input
          type="tel"
          className={inputClass}
          value={form.phone}
          onChange={(e) => update("phone", e.target.value)}
          placeholder="(555) 123-4567"
        />
      </div>

      <div>
        <label className={labelClass}>
          Current Practice Management Software{" "}
          <span className="text-[var(--m-red-soft)]">*</span>
        </label>
        <select
          className={selectClass}
          value={form.currentPms}
          onChange={(e) => update("currentPms", e.target.value)}
        >
          <option value="">Select your PMS</option>
          {pmsList.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        {errors.currentPms && (
          <p className={errorClass}>{errors.currentPms}</p>
        )}
      </div>

      <div>
        <label className={labelClass}>
          Treatment plans per month (optional)
        </label>
        <select
          className={selectClass}
          value={form.plansPerMonth}
          onChange={(e) => update("plansPerMonth", e.target.value)}
        >
          <option value="">Select a range</option>
          {planRanges.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>
          Anything you&apos;d like us to know? (optional)
        </label>
        <textarea
          className={`${inputClass} resize-none`}
          rows={3}
          value={form.notes}
          onChange={(e) => update("notes", e.target.value)}
          placeholder="Tell us about your practice or what you're hoping to achieve..."
        />
      </div>

      {apiError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-[var(--m-red-soft)]">
          {apiError}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-[var(--m-teal-mid)] py-3.5 text-base font-semibold text-white hover:bg-[var(--m-teal)] hover:scale-[1.02] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {submitting ? "Submitting..." : "Join the Waitlist & Request Demo \u2192"}
      </button>
    </form>
  );
}
