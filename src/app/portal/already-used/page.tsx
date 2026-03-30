import { ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function PortalAlreadyUsedPage() {
  return (
    <div className="min-h-screen bg-stone-50 p-6">
      <div className="mx-auto max-w-[420px] flex items-center justify-center min-h-[80vh]">
        <Card className="border-stone-200 shadow-sm">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <ShieldCheck className="mx-auto h-12 w-12 text-stone-400" />
            <h1 className="text-xl font-semibold text-stone-900">
              You&apos;ve already viewed this treatment plan
            </h1>
            <p className="text-sm text-stone-500 leading-relaxed">
              If you&apos;d like to schedule your appointment, call the office or
              reply to any of our messages.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
