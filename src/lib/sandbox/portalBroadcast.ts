/**
 * Cross-tab broadcast channel for portal → admin sandbox communication.
 *
 * The portal opens in a new tab which has its own sessionStorage (and thus
 * its own Zustand sandbox store instance). This channel lets the portal tab
 * send booking data back to the admin tab so it can update its store and
 * invalidate React Query caches.
 */

import type { Message, Conversation } from "@/types/app.types";
import type { SandboxActivity } from "@/stores/sandbox-store";

const CHANNEL_NAME = "followdent-sandbox-portal";

// ─── Message types ──────────────────────────────────────────────────────────

export interface PortalBookingBroadcast {
  type: "portal_booking";
  treatmentId: string;
  treatmentUpdate: { status: string; decided_at: string };
  revenueRecovered: number;
  activityItem: SandboxActivity;
  message: Message;
  conversationUpdate: {
    conversationId: string;
    data: Partial<Conversation>;
  } | null;
}

export type PortalBroadcastMessage = PortalBookingBroadcast;

// ─── Sender (portal tab) ───────────────────────────────────────────────────

export function broadcastPortalBooking(data: PortalBookingBroadcast): void {
  try {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage(data);
    channel.close();
  } catch {
    // BroadcastChannel not supported — silent fallback
  }
}

// ─── Listener (admin tab) ───────────────────────────────────────────────────

export function listenForPortalBroadcasts(
  handler: (data: PortalBroadcastMessage) => void
): () => void {
  try {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = (event: MessageEvent<PortalBroadcastMessage>) => {
      handler(event.data);
    };
    return () => channel.close();
  } catch {
    return () => {};
  }
}
