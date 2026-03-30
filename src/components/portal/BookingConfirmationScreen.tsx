"use client";

import { CheckCircle2, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BookingConfirmationScreenProps {
  practice: {
    name: string;
    phone: string;
  };
}

export function BookingConfirmationScreen({
  practice,
}: BookingConfirmationScreenProps) {
  return (
    <div className="min-h-screen bg-stone-50 p-6">
      <div className="mx-auto max-w-[420px] flex flex-col items-center justify-center min-h-[80vh] space-y-6 text-center">
        <CheckCircle2 className="h-16 w-16 text-green-500" />

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-stone-900">
            You&apos;re all set!
          </h1>
          <p className="text-stone-600">
            {practice.name} will be in touch shortly to confirm your appointment
            time.
          </p>
        </div>

        <Button variant="outline" size="lg" asChild>
          <a href={`tel:${practice.phone}`}>
            <Phone className="mr-2 h-4 w-4" />
            Questions? Call us at {practice.phone}
          </a>
        </Button>
      </div>
    </div>
  );
}
