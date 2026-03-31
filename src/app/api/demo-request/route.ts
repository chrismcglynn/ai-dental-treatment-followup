import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { addToBrevoWaitlist } from "@/lib/brevo";

const demoRequestSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Valid email required"),
  role: z.string().min(1, "Role is required"),
  practiceName: z.string().min(1, "Practice name is required"),
  phone: z.string().optional(),
  currentPms: z.string().min(1, "PMS selection is required"),
  plansPerMonth: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = demoRequestSchema.parse(body);

    await addToBrevoWaitlist(data);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Demo request error:", error);
    return NextResponse.json(
      { error: "Failed to submit. Please try again." },
      { status: 500 }
    );
  }
}
