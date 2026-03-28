import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  // In production, verify with Stripe SDK:
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  // const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  const event = JSON.parse(body);

  const supabase = createAdminClient();

  switch (event.type) {
    // ---------- Checkout completed → activate subscription ----------
    case "checkout.session.completed": {
      const session = event.data.object;
      const customerId = session.customer;
      const subscriptionId = session.subscription;
      const practiceId = session.metadata?.practice_id;

      if (practiceId) {
        await supabase
          .from("practices")
          .update({
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            subscription_status: "active",
          })
          .eq("id", practiceId);
      } else if (customerId) {
        // Fallback: match by customer ID
        await supabase
          .from("practices")
          .update({
            stripe_subscription_id: subscriptionId,
            subscription_status: "active",
          })
          .eq("stripe_customer_id", customerId);
      }
      break;
    }

    // ---------- Subscription lifecycle ----------
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object;
      const customerId = subscription.customer;
      const status = subscription.status;

      const statusMap: Record<string, string> = {
        trialing: "trialing",
        active: "active",
        past_due: "past_due",
        canceled: "canceled",
        unpaid: "past_due",
      };

      await supabase
        .from("practices")
        .update({
          stripe_subscription_id: subscription.id,
          subscription_status: (statusMap[status] ?? "free") as
            | "trialing"
            | "active"
            | "past_due"
            | "canceled"
            | "free",
        })
        .eq("stripe_customer_id", customerId);
      break;
    }

    // ---------- Payment failed → mark past_due, notify via Resend ----------
    case "invoice.payment_failed": {
      const invoice = event.data.object;
      const customerId = invoice.customer;

      // Update status to past_due
      const { data: practice } = await supabase
        .from("practices")
        .update({ subscription_status: "past_due" })
        .eq("stripe_customer_id", customerId)
        .select("email, name")
        .single();

      // Send notification email via Resend
      if (practice?.email && process.env.RESEND_API_KEY) {
        try {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: "billing@followup.dental",
              to: practice.email,
              subject: "Payment Failed — Action Required",
              html: `
                <h2>Payment Failed</h2>
                <p>Hi ${practice.name ?? "there"},</p>
                <p>We were unable to process your subscription payment.
                   Please update your payment method to avoid any interruption to your service.</p>
                <p>Your sequences will continue to run for 7 days while we retry the payment.</p>
                <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=billing">Update Payment Method</a></p>
              `,
            }),
          });
        } catch {
          // Log but don't fail the webhook
          console.error("Failed to send payment failure email");
        }
      }
      break;
    }

    // ---------- Subscription deleted → cancel ----------
    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      await supabase
        .from("practices")
        .update({
          subscription_status: "canceled",
        })
        .eq("stripe_subscription_id", subscription.id);
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
