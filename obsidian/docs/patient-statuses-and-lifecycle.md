# Patient Statuses and Lifecycle

This document explains the various statuses shown throughout the app, how patients move between states, and how treatment plans, sequences, and enrollments connect.

---

## Patient Status Labels (Patients List)

The **Status** badge on the patients list is a computed label based on the patient's current state. It is not a single database field — it derives from a combination of the patient record, their treatment plans, and their sequence enrollments.

The labels are evaluated in this priority order:

| Priority | Label              | Condition                                                                 | Badge Style  |
|----------|--------------------|---------------------------------------------------------------------------|--------------|
| 1        | **Do not contact** | Patient record has `status = "archived"`                                  | Destructive (red) |
| 2        | **In sequence**    | Patient has at least one enrollment with `status = "active"`              | Default (primary) |
| 3        | **Pending**        | Patient has at least one treatment plan with `status = "pending"`         | Outline      |
| 4        | **No active plan** | None of the above — no active enrollments and no pending treatment plans  | Secondary (gray) |

### What each label means in practice

- **Do not contact** — A staff member manually flagged this patient. All outbound messaging is blocked. No sequences will run. This overrides everything else.
- **In sequence** — The patient is currently enrolled in an automated follow-up sequence (e.g., receiving SMS/email touchpoints encouraging them to book). They may also have pending treatments, but the "In sequence" label takes priority because it indicates active outreach is underway.
- **Pending** — The patient has one or more treatment plans that were presented but not yet accepted or declined. No automated sequence is running for them. This is the typical state for a patient who just left the office with an unscheduled treatment plan.
- **No active plan** — The patient has no pending treatment plans and is not in any active sequence. All treatments are either accepted, declined, or completed (or the patient has no treatments at all). This patient doesn't need follow-up right now.

---

## Treatment Plan Statuses

Each treatment plan (`treatments` table) has its own status:

| Status        | Meaning                                                        |
|---------------|----------------------------------------------------------------|
| **pending**   | Presented to the patient but no decision made yet              |
| **accepted**  | Patient agreed to the treatment                                |
| **declined**  | Patient declined the treatment                                 |
| **completed** | Treatment was performed                                        |

### Lifecycle

```
pending  ──>  accepted  ──>  completed
   │
   └──>  declined  (triggers automatic enrollment if matching sequence exists)
```

When a treatment transitions from `pending` to `declined`, a Supabase webhook fires and automatically enrolls the patient in any active sequences with `trigger_type = "treatment_declined"`. This is the primary automated entry point for follow-up outreach.

---

## Sequence Enrollment Statuses

When a patient is enrolled in a sequence (the `sequence_enrollments` table), the enrollment has its own status:

| Status          | Meaning                                                                          |
|-----------------|----------------------------------------------------------------------------------|
| **active**      | Currently progressing through sequence touchpoints (SMS, email, voicemail drops)  |
| **completed**   | Reached the end of all touchpoints without converting                            |
| **converted**   | Patient responded with booking intent (e.g., replied "yes", "schedule", "book")  |
| **opted_out**   | Patient opted out of receiving messages                                          |
| **paused**      | Enrollment paused (e.g., patient marked DNC, or manually paused)                 |

### Lifecycle

```
active  ──>  converted   (patient replied with booking intent)
  │
  ├──>  completed       (all touchpoints sent, no conversion)
  │
  ├──>  opted_out       (patient opted out)
  │
  └──>  paused          (manually paused or patient marked DNC)
```

An enrollment tracks progress via `current_touchpoint` (0-indexed), which increments as each touchpoint in the sequence is sent.

---

## How Enrollment Happens

### Automatic (treatment declined)

1. A treatment plan status changes to `declined`
2. A Supabase webhook (`/api/webhooks/supabase`) fires
3. The system queries for active sequences with `trigger_type = "treatment_declined"`
4. An enrollment is created for each matching sequence with `status = "active"` and `current_touchpoint = 0`

### Manual (staff-initiated)

1. Staff navigates to a patient's detail page
2. Clicks "Start Manual Sequence"
3. Selects from available active sequences (sequences the patient is not already enrolled in)
4. An enrollment is created with `status = "active"` and `current_touchpoint = 0`

---

## Sequence Trigger Types

Sequences themselves have a `trigger_type` that determines when they fire:

| Trigger Type           | Behavior                                                          |
|------------------------|-------------------------------------------------------------------|
| **treatment_declined** | Auto-enrolls patients when a treatment is declined                |
| **manual**             | Only runs when staff manually enrolls a patient                   |
| **no_show**            | Intended for no-show follow-up (not yet implemented in webhooks)  |
| **schedule**           | Intended for scheduled/timed triggers (not yet implemented)       |

---

## Conversion Detection

When a patient replies to an outbound message (via Twilio webhook at `/api/webhooks/twilio`), the system checks for booking-intent keywords like "book", "schedule", "appointment", or "yes". If detected, all active enrollments for that patient are updated to `status = "converted"`.

---

## Patient Record Status vs. Display Status

It's important to distinguish between these two:

- **Patient record `status`** (database field): `active`, `inactive`, or `archived`. The `archived` status is used for "Do Not Contact" — it blocks all messaging.
- **Patient display status** (computed label in the UI): `Do not contact`, `In sequence`, `Pending`, or `No active plan`. This is derived from the combination of the patient record status, their treatments, and their enrollments.

The database field is simple; the display label tells the full story at a glance.
