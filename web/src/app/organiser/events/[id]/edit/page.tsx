import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOrganiser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { toMalaysiaInput } from "@/lib/format";
import { heading, monoTag } from "@/lib/ui";
import { updateEvent } from "../../../actions";
import { EventForm } from "../../../new/event-form";

export const metadata = { title: "Edit event | FCSIT Event Hub" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function EditEventPage(props: PageProps<"/organiser/events/[id]/edit">) {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Suspense fallback={<p className={`${monoTag} text-muted`}>loading event...</p>}>
        <EditLoader params={props.params} />
      </Suspense>
    </div>
  );
}

async function EditLoader({ params }: { params: PageProps<"/organiser/events/[id]/edit">["params"] }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const user = await requireOrganiser();
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("event_id, title, description, venue, start_at, end_at, reg_close_at, capacity, mode, status")
    .eq("event_id", id)
    .eq("organiser_id", user.id)
    .maybeSingle();
  if (!event) notFound();

  const { data: rows } = await supabase.rpc("event_attendance", { p_event_id: id });
  const people = rows ?? [];
  const confirmed = people.filter((r) => r.status === "registered" || r.status === "accepted").length;

  return (
    <>
      <Link href={`/organiser/events/${event.event_id}`} className={`${monoTag} inline-flex rounded-full bg-paper px-3 py-1.5 hover:bg-amber`}>
        &larr; {event.title}
      </Link>
      <div className="rounded-[var(--radius-bento)] bg-paper p-6 sm:p-8">
        <p className={`${monoTag} text-muted`}>{"// edit"}</p>
        <h1 className={`${heading} mt-1 mb-2 text-5xl`}>Edit event</h1>
        {people.length > 0 && (
          <p className="mb-6 rounded-2xl bg-amber/40 px-4 py-2 text-sm font-semibold">
            {people.length} {people.length === 1 ? "person has" : "people have"} registered. Changes to the time or venue are visible to them straight away.
          </p>
        )}
        <EventForm
          action={updateEvent.bind(null, event.event_id)}
          submitLabel="Save changes"
          modeLocked={people.length > 0}
          minCapacity={Math.max(confirmed, 1)}
          initial={{
            title: event.title,
            description: event.description,
            venue: event.venue ?? "",
            startAt: toMalaysiaInput(event.start_at),
            endAt: toMalaysiaInput(event.end_at),
            regCloseAt: toMalaysiaInput(event.reg_close_at),
            capacity: event.capacity,
            mode: event.mode,
          }}
        />
      </div>
    </>
  );
}
