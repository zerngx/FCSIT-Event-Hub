import { Suspense } from "react";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/format";
import { PixelQr, Sparkle } from "@/components/decor";
import { btnGhost, heading, monoTag } from "@/lib/ui";
import { StatusBadge } from "./status-badge";
import { requestOrganiserAccess } from "../organiser/actions";
import type { Enums } from "@/lib/database.types";
import { Skeleton } from "@/components/skeleton";
import { SubmitButton } from "@/components/submit-button";

export const metadata = { title: "Events | FCSIT Event Hub" };

const tones = ["bg-amber", "bg-sky", "bg-tangerine", "bg-forest-soft"];

export default function EventsPage() {
  return (
    <div className="space-y-5">
      <header className="relative overflow-hidden rounded-[var(--radius-bento)] bg-ink p-6 text-cream sm:p-8">
        <Sparkle className="absolute top-6 right-8 h-10 w-10 rotate-12 text-amber" />
        <p className={`${monoTag} text-amber`}>{"// what's on"}</p>
        <h1 className={`${heading} mt-2 text-5xl sm:text-6xl`}>Upcoming events</h1>
        <p className="mt-2 max-w-md text-sm text-cream/80">Every published FCSIT event, in one place. Tap a card to see seats and register.</p>
      </header>
      <Suspense fallback={<Skeleton variant="cards" />}>
        <EventList />
      </Suspense>
    </div>
  );
}

async function EventList() {
  const user = await requireUser();
  const supabase = await createClient();

  const [{ data: events, error }, { data: mine }] = await Promise.all([
    supabase
      .from("events")
      .select("event_id, title, venue, start_at, capacity, mode")
      .eq("status", "published")
      .gte("end_at", new Date().toISOString())
      .order("start_at", { ascending: true }),
    supabase.from("registrations").select("event_id, status").eq("student_id", user.id),
  ]);

  if (error) return <p className="text-sm font-semibold text-cherry">Could not load events. Try again later.</p>;

  const statusByEvent = new Map((mine ?? []).map((r) => [r.event_id, r.status]));

  return (
    <>
      <OrganiserCta role={user.role} status={user.organiserStatus} />
      {!events?.length ? (
        <p className="rounded-[var(--radius-bento)] bg-paper p-8 text-sm text-muted">No upcoming events yet. Check back soon.</p>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((e, i) => (
            <li key={e.event_id}>
              <Link
                href={`/events/${e.event_id}`}
                className={`group relative flex h-full flex-col overflow-hidden rounded-[var(--radius-bento)] p-6 transition hover:-translate-y-1 hover:rotate-[-0.6deg] ${tones[i % tones.length]}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className={`${monoTag} rounded-full bg-paper/70 px-2.5 py-1`}>
                    {e.mode === "open" ? "open" : "apply"}
                  </span>
                  <StatusBadge status={statusByEvent.get(e.event_id)} />
                </div>
                <h2 className={`${heading} mt-6 text-3xl`}>{e.title}</h2>
                <p className="mt-3 text-sm font-semibold">{formatDateTime(e.start_at)}</p>
                <p className="text-sm">{e.venue ?? "Venue to be announced"}</p>
                <div className="mt-auto flex items-end justify-between pt-6">
                  <p className="font-mono text-xs">
                    <span className="font-display text-2xl">{e.capacity}</span> seats
                  </p>
                  <span className="rounded-xl bg-paper p-1.5 transition group-hover:rotate-6">
                    <PixelQr seed={e.event_id} className="h-10 w-10" />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function OrganiserCta({ role, status }: { role: Enums<"user_role">; status: Enums<"organiser_status"> }) {
  if (role !== "student") return null;
  if (status === "pending") {
    return (
      <p className={`${monoTag} rounded-full bg-paper px-4 py-3 text-muted`}>
        {"// organiser request pending admin approval"}
      </p>
    );
  }
  return (
    <form action={requestOrganiserAccess} className="flex flex-wrap items-center justify-between gap-3 rounded-full bg-paper py-2 pr-2 pl-5 text-sm">
      <span className="font-semibold">
        {status === "rejected" ? "Your last organiser request was declined." : "Running a society event?"}
      </span>
      <SubmitButton className={btnGhost} pendingLabel="Sending...">Request organiser access</SubmitButton>
    </form>
  );
}
