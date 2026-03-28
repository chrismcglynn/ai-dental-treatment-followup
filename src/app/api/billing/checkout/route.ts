import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const { practiceId } = await request.json();

  if (!practiceId) {
    return NextResponse.json({ error: "Missing practiceId", code: "VALIDATION_ERROR" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: practice } = await supabase
    .from("practices")
    .select("stripe_customer_id, email, name")
    .eq("id", practiceId)
    .single();

  if (!practice) {
    return NextResponse.json({ error: "Practice not found", code: "NOT_FOUND" }, { status: 404 });
  }

  // In production, create a Stripe Checkout Session:
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  // const session = await stripe.checkout.sessions.create({
  //   mode: "subscription",
  //   customer: practice.stripe_customer_id ?? undefined,
  //   customer_email: !practice.stripe_customer_id ? practice.email : undefined,
  //   line_items: [{ price: process.env.STRIPE_PRO_PRICE_ID!, quantity: 1 }],
  //   success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=billing&session_id={CHECKOUT_SESSION_ID}`,
  //   cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=billing`,
  //   metadata: { practice_id: practiceId },
  // });
  // return NextResponse.json({ url: session.url });

  // Placeholder response until Stripe is configured
  return NextResponse.json({
    url: `/settings?tab=billing&upgrade=pending`,
    message: "Stripe Checkout not yet configured. Set STRIPE_SECRET_KEY and STRIPE_PRO_PRICE_ID.",
  });
}
