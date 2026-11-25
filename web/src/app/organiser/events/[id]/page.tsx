import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOrganiser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime, formatTime } from "@/lib/format";
import { setEventStatus } from "../../actions";
import { Sparkle } from "@/components/decor";
import { btnDark, btnForest, btnGhost, heading, monoTag } from "@/lib/ui";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function ManageEventPage(props: PageProps<"/organiser/events/[id]">) {
  return (
    <div className="space-y-4">
      <Link href="/organiser" className={`${monoTag} inline-flex rounded-full bg-paper px-3 py-1.5 hover:bg-amber`}>
        &larr; my events
      </Link>
      <Suspense fallback={<p className={`${monoTag} text-muted`}>loading event...</p>}>
        <ManageEvent params={props.params} />
      </Suspense>
    </div>
  );
}

async function ManageEvent({ params }: { params: PageProps<"/organiser/events/[id]">["params"] }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const user = await requireOrganiser();
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("event_id, title, venue, start_at, end_at, capacity, mode, status, checkin_open_at, checkin_close_at")
    .eq("event_id", id)
    .eq("organiser_id", user.id)
    .maybeSingle();
  if (!event) notFound();

  const { data: rows } = await supabase.rpc("event_attendance", { p_event_id: id });
  const people = rows ?? [];
  const confirmed = people.filter((r) => r.status === "registered" || r.status === "accepted");
  const attended = confirmed.filter((r) => r.attended).length;

  const statusTone = event.status === "published" ? "bg-forest text-amber" : event.status === "closed" ? "bg-ink text-cream" : "bg-paper";

  return (
    <div className="space-y-5">
      <header className="relative overflow-hidden rounded-[var(--radius-bento)] bg-amber p-6 sm:p-8">
        <Sparkle className="absolute top-6 right-8 h-10 w-10 rotate-12 text-paper" />
        <span className={`${monoTag} rounded-full px-3 py-1 ${statusTone}`}>{event.status}</span>
        <h1 className={`${heading} mt-4 text-5xl sm:text-6xl`}>{event.title}</h1>
        <p className="mt-3 text-sm font-semibold">
          {formatDateTime(event.start_at)} to {formatTime(event.end_at)} · {event.venue ?? "Venue to be announced"}
        </p>
        <p className={`${monoTag} mt-1 text-ink/70`}>
          check-in: {event.checkin_open_at ? formatTime(event.checkin_open_at) : "any time"} to{" "}
          {event.checkin_close_at ? formatTime(event.checkin_close_at) : "any time"}
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          {event.status === "draft" && (
            <form action={setEventStatus.bind(null, event.event_id, "published")}>
              <button className={btnForest}>Publish</button>
            </form>
          )}
          {event.status === "published" && (
            <Link href={`/organiser/events/${event.event_id}/scan`} className={btnDark}>
              Open scanner
            </Link>
          )}
          {event.status === "published" && (
            <form action={setEventStatus.bind(null, event.event_id, "closed")}>
              <button className={btnGhost}>Close event</button>
            </form>
          )}
          {event.status === "closed" && (
            <form action={setEventStatus.bind(null, event.event_id, "published")}>
              <button className={btnGhost}>Reopen</button>
            </form>
          )}
          <Link href={`/organiser/events/${event.event_id}/edit`} className={btnGhost}>
            Edit details
          </Link>
          <a href={`/organiser/events/${event.event_id}/attendance.csv`} className={btnGhost}>
            Download CSV
          </a>
        </div>
      </header>

      <dl className="grid grid-cols-3 gap-5">
        {[
          ["registered", `${confirmed.length}`, `of ${event.capacity} seats`, "bg-sky"],
          ["attended", `${attended}`, "scanned at the door", "bg-forest text-cream"],
          ["absent", `${confirmed.length - attended}`, "so far", "bg-tangerine"],
        ].map(([k, v, sub, tone]) => (
          <div key={k} className={`rounded-[var(--radius-bento)] p-5 sm:p-6 ${tone}`}>
            <dt className={monoTag}>{k}</dt>
            <dd className="mt-2 font-display text-5xl leading-none">{v}</dd>
            <dd className="mt-1 text-xs opacity-80">{sub}</dd>
          </div>
        ))}
      </dl>

      <section aria-label="Participants" className="rounded-[var(--radius-bento)] bg-paper p-6 sm:p-8">
        <h2 className={`${heading} text-3xl`}>Participants</h2>
        {people.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Nobody has registered yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className={`${monoTag} text-muted`}>
                  <th className="px-3 py-2 font-normal">Name</th>
                  <th className="px-3 py-2 font-normal">Matric no.</th>
                  <th className="px-3 py-2 font-normal">Status</th>
                  <th className="px-3 py-2 font-normal">Attendance</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-sage">
                {people.map((p) => (
                  <tr key={p.registration_id}>
                    <td className="px-3 py-3 font-semibold">{p.full_name}</td>
                    <td className="px-3 py-3 font-mono text-xs">{p.matric_no ?? "-"}</td>
                    <td className="px-3 py-3 capitalize">{p.status}</td>
                    <td className="px-3 py-3">
                      {p.attended && p.checked_in_at ? (
                        <span className="rounded-full bg-forest-soft px-2.5 py-1 font-mono text-xs text-forest">
                          ✓ {formatTime(p.checked_in_at)}
                        </span>
                      ) : p.status === "registered" || p.status === "accepted" ? (
                        <span className="rounded-full bg-tangerine/25 px-2.5 py-1 font-mono text-xs">absent</span>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
