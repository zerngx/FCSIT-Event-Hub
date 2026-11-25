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

type EventValues = {
  title: string;
  description: string;
  venue: string | null;
  capacity: number;
  mode: "open" | "application";
  start_at: string;
  end_at: string;
  reg_close_at: string;
  cancel_deadline: string;
  checkin_open_at: string;
  checkin_close_at: string;
};

// Shared by create and edit so both enforce the same rules.
function parseEventForm(formData: FormData): { error: string } | { values: EventValues } {
  const title = String(formData.get("title") ?? "").trim();
  const capacity = Number(formData.get("capacity"));
  const startAt = malaysiaTimeToIso(formData.get("start_at"));
  const endAt = malaysiaTimeToIso(formData.get("end_at"));
  const regCloseAt = malaysiaTimeToIso(formData.get("reg_close_at"));

  if (!title) return { error: "Enter a title." };
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 9999) return { error: "Capacity must be between 1 and 9999." };
  if (!startAt || !endAt || !regCloseAt) return { error: "Fill in the start, end and registration closing times." };
  if (Date.parse(endAt) <= Date.parse(startAt)) return { error: "The event must end after it starts." };
  if (Date.parse(regCloseAt) > Date.parse(startAt)) return { error: "Registration must close before the event starts." };

  return {
    values: {
      title,
      description: String(formData.get("description") ?? "").trim(),
      venue: String(formData.get("venue") ?? "").trim() || null,
      capacity,
      mode: formData.get("mode") === "application" ? "application" : "open",
      start_at: startAt,
      end_at: endAt,
      reg_close_at: regCloseAt,
      cancel_deadline: regCloseAt,
      // Check-in opens 30 minutes before the start and closes when the event ends.
      checkin_open_at: new Date(Date.parse(startAt) - 30 * 60_000).toISOString(),
      checkin_close_at: endAt,
    },
  };
}

export async function createEvent(_prev: EventFormState, formData: FormData): Promise<EventFormState> {
  const user = await requireOrganiser();
  const parsed = parseEventForm(formData);
  if ("error" in parsed) return parsed;
  if (Date.parse(parsed.values.reg_close_at) <= Date.now()) return { error: "Registration must close in the future." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .insert({ organiser_id: user.id, ...parsed.values, status: "draft" })
    .select("event_id")
    .single();
  if (error) return { error: error.message };

  redirect(`/organiser/events/${data.event_id}`);
}

// Bound to an event id in the page: updateEvent.bind(null, id).
export async function updateEvent(eventId: string, _prev: EventFormState, formData: FormData): Promise<EventFormState> {
  if (!UUID.test(eventId)) return { error: "Unknown event." };
  const user = await requireOrganiser();
  const parsed = parseEventForm(formData);
  if ("error" in parsed) return parsed;
  const v = parsed.values;

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("events")
    .select("mode, reg_open_at")
    .eq("event_id", eventId)
    .eq("organiser_id", user.id)
    .maybeSingle();
  if (!existing) return { error: "Event not found." };

  // Guard rules that protect people who already registered.
  const { data: rows } = await supabase.rpc("event_attendance", { p_event_id: eventId });
  const people = rows ?? [];
  const confirmed = people.filter((r) => r.status === "registered" || r.status === "accepted").length;
  if (v.capacity < confirmed) {
    return { error: `${confirmed} people already hold a seat, so seats cannot go below ${confirmed}.` };
  }
  if (people.length > 0 && v.mode !== existing.mode) {
    return { error: "The registration type cannot change once people have registered." };
  }
  if (Date.parse(v.reg_close_at) <= Date.parse(existing.reg_open_at)) {
    return { error: "Registration must close after it opened." };
  }

  const { error } = await supabase.from("events").update(v).eq("event_id", eventId).eq("organiser_id", user.id);
  if (error) return { error: "Could not save the changes." };

  revalidatePath("/organiser");
  revalidatePath(`/organiser/events/${eventId}`);
  revalidatePath("/events");
  revalidatePath(`/events/${eventId}`);
  redirect(`/organiser/events/${eventId}`);
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
  const result = data as ScanResult;
  // The database returns the private storage path; storage policies let this organiser sign it
  // only for students registered to their own events.
  if (result.photo_url) {
    const { data: signed } = await supabase.storage.from("profile-photos").createSignedUrl(result.photo_url, 300);
    result.photo_url = signed?.signedUrl ?? null;
  }
  return result;
}
