# Brevo Demo Link Setup

## Overview

When a user submits the `/request-demo` form, the API generates a personalized demo link and stores it as a Brevo contact attribute (`DEMO_LINK`). You then send a welcome email via Brevo that includes this link, directing them to `demo.retaine.io` with their info pre-filled.

## 1. Create Contact Attributes in Brevo

Go to **Contacts > Settings > Contact Attributes** and create:

| Attribute Name   | Type |
| ---------------- | ---- |
| `PRACTICE_NAME`  | Text |
| `ROLE`           | Text |
| `PHONE`          | Text |
| `CURRENT_PMS`    | Text |
| `PLANS_PER_MONTH`| Text |
| `NOTES`          | Text |
| `SOURCE`         | Text |
| `SUBMITTED_AT`   | Text |
| `DEMO_LINK`      | Text |

> Brevo silently ignores attributes that don't exist in your account. If these aren't created, only email and name will be saved.

## 2. Verify Environment Variables

Ensure these are set in `.env.local` (and in your production environment):

```
BREVO_API_KEY=your-api-key
BREVO_WAITLIST_LIST_ID=3
```

- `BREVO_WAITLIST_LIST_ID` should match the list ID for your waitlist in Brevo.

## 3. Test the Form Submission

1. Submit the `/request-demo` form locally
2. Go to **Contacts** in Brevo and find the contact by email
3. Verify all attributes are populated, including `DEMO_LINK`

The `DEMO_LINK` value will look like:
```
https://demo.retaine.io?d=eyJmdWxsX25hbWUiOiJKYW5lIFNtaXRoIi...
```

## 4. Create the Email Template

1. Go to **Campaigns > Templates** (or **Transactional > Templates**)
2. Create a new template for the demo welcome email
3. Available personalization variables:
   - `{{ contact.FIRSTNAME }}` — first name
   - `{{ contact.LASTNAME }}` — last name
   - `{{ contact.PRACTICE_NAME }}` — practice name
   - `{{ contact.ROLE }}` — their role
   - `{{ contact.DEMO_LINK }}` — the personalized demo URL (use as CTA button href)

Example CTA button: **"Launch Your Demo"** linking to `{{ contact.DEMO_LINK }}`

## 5. Send the Email

**Option A: Manual** — Review each submission and send the template manually from the contact's page.

**Option B: Automation** — Set up a Brevo automation:
- **Trigger:** Contact added to waitlist (list ID from env var)
- **Action:** Send email template
- **Delay (optional):** Add a short delay if you want it to feel personal rather than instant

## How the Demo Link Works

1. User clicks the link in the email
2. They land on `demo.retaine.io?d=<encoded-data>`
3. The demo page decodes the `d` param and shows a welcome card with their name, practice, and email pre-filled
4. They click "Start Demo" and enter the sandbox dashboard
5. If someone visits `demo.retaine.io` without a `?d=` param (e.g., from an expo), they see the normal landing page with a signup form

## Manually Generating a Demo Link

For contacts met at expos or events, generate a link by base64-encoding their info:

```js
btoa(JSON.stringify({
  full_name: "Dr. Sarah Chen",
  email: "sarah@brightsmiledental.com",
  role: "dentist",
  practice_name: "Bright Smile Dental"
}))
```

Valid roles: `dentist`, `hygienist`, `front_office`, `office_manager`, `dental_assistant`

Append the output to: `https://demo.retaine.io?d=<output>`
