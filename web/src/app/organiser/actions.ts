"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireOrganiser, requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/database.types";

export type EventFormState = { error?: string } | undefined;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// <input type="datetime-local"> has no zone; the faculty is in Malaysia (UTC+8, no daylight saving).
function malaysiaTimeToIso(value: FormDataEntryValue | null): string | null {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const date = new Date(`${text}:00+08:00`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export async function createEvent(_prev: EventFormState, formData: FormData): Promise<EventFormState> {
  const user = await requireOrganiser();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const venue = String(formData.get("venue") ?? "").trim();
  const capacity = Number(formData.get("capacity"));
  const mode = formData.get("mode") === "application" ? "application" : "open";
  const startAt = malaysiaTimeToIso(formData.get("start_at"));
  const endAt = malaysiaTimeToIso(formData.get("end_at"));
  const regCloseAt = malaysiaTimeToIso(formData.get("reg_close_at"));

  if (!title) return { error: "Enter a title." };
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 9999) return { error: "Capacity must be between 1 and 9999." };
  if (!startAt || !endAt || !regCloseAt) return { error: "Fill in the start, end and registration closing times." };
  if (Date.parse(endAt) <= Date.parse(startAt)) return { error: "The event must end after it starts." };
  if (Date.parse(regCloseAt) > Date.parse(startAt)) return { error: "Registration must close before the event starts." };
  if (Date.parse(regCloseAt) <= Date.now()) return { error: "Registration must close in the future." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .insert({
      organiser_id: user.id,
      title,
      description,
      venue: venue || null,
      start_at: startAt,
      end_at: endAt,
      capacity,
      mode,
      reg_close_at: regCloseAt,
      cancel_deadline: regCloseAt,
      // Check-in opens 30 minutes before the start and closes when the event ends.
      checkin_open_at: new Date(Date.parse(startAt) - 30 * 60_000).toISOString(),
      checkin_close_at: endAt,
      status: "draft",
    })
    .select("event_id")
    .single();
  if (error) return { error: error.message };

  redirect(`/organiser/events/${data.event_id}`);
}

export async function setEventStatus(eventId: string, status: Enums<"event_status">) {
  if (!UUID.test(eventId)) return;
  const user = await requireOrganiser();
  const supabase = await createClient();
  await supabase.from("events").update({ status }).eq("event_id", eventId).eq("organiser_id", user.id);
  revalidatePath("/organiser");
  revalidatePath(`/organiser/events/${eventId}`);
  revalidatePath("/events");
}

export async function requestOrganiserAccess() {
  const user = await requireUser();
  if (user.role !== "student") return;
  const supabase = await createClient();
  // The database trigger only lets a student move from none/rejected to pending.
  await supabase.from("users").update({ organiser_status: "pending" }).eq("user_id", user.id);
  revalidatePath("/events");
}

export type ScanResult = {
  ok: boolean;
  reason?: string;
  full_name?: string;
  matric_no?: string | null;
  programme?: string | null;
  photo_url?: string | null;
  event?: string;
  checked_in_at?: string;
  first_at?: string;
  error?: string;
};

export async function checkInTicket(token: string): Promise<ScanResult> {
  await requireOrganiser();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("check_in", { p_token: token.trim() });
  if (error) return { ok: false, error: "Could not check in. Try again." };
  return data as ScanResult;
}
