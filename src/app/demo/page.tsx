import type { Metadata } from "next";
import { DemoPageClient } from "./DemoPageClient";

export const metadata: Metadata = {
  title: "Live Demo — FollowDent | AI Treatment Plan Follow-Up",
  description:
    "See how FollowDent automatically follows up with patients who have unscheduled treatment plans. Interactive demo — no signup required.",
  openGraph: {
    title: "See FollowDent in action",
    description:
      "Watch AI-powered treatment plan follow-up recover revenue for a real dental practice.",
  },
};

export default function DemoPage() {
  return <DemoPageClient />;
}
