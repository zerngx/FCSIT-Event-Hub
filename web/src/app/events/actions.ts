"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/database.types";

export type RegisterState =
  | { error: string; status?: undefined }
  | { error?: undefined; status: Enums<"registration_status"> }
  | undefined;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type QrTokenState = { token: string; secondsLeft: number } | { error: string };

// Returns a signed token for the student's own ticket. The signing secret stays in the database.
export async function getQrToken(ticketId: string): Promise<QrTokenState> {
  if (!UUID.test(ticketId)) return { error: "Unknown ticket." };
  await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("issue_qr_token", { p_ticket_id: ticketId });
  if (error || !data || typeof data !== "object" || Array.isArray(data)) return { error: "Ticket unavailable." };
  return { token: String(data.token), secondsLeft: Number(data.seconds_left) };
}

// Seat control, duplicate checks and the waitlist all happen inside the database function
// register_for_event(), so two students cannot take the same last seat.
// Bound to an event id in the page: registerForEvent.bind(null, id). useActionState also passes
// the previous state and form data, which this action does not need.
export async function registerForEvent(eventId: string): Promise<RegisterState> {
  if (!UUID.test(eventId)) return { error: "Unknown event." };

  const user = await requireUser();
  if (user.role !== "student") return { error: "Only students can register for events." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("register_for_event", { p_event_id: eventId });
  if (error) return { error: error.message };

  revalidatePath("/events");
  revalidatePath(`/events/${eventId}`);
  return { status: data };
}
