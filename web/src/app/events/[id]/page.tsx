import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime, formatTime, isNowBetween } from "@/lib/format";
import { registerForEvent } from "../actions";
import { StatusBadge } from "../status-badge";
import { RegisterButton } from "./register-button";
import { TicketQr } from "./ticket-qr";
import { Sparkle } from "@/components/decor";
import { heading, monoTag } from "@/lib/ui";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function EventPage(props: PageProps<"/events/[id]">) {
  return (
    <div className="space-y-4">
      <Link href="/events" className={`${monoTag} inline-flex rounded-full bg-paper px-3 py-1.5 hover:bg-amber`}>
        &larr; all events
      </Link>
      <Suspense fallback={<p className={`${monoTag} text-muted`}>loading event...</p>}>
        <EventDetail params={props.params} />
      </Suspense>
    </div>
  );
}

async function EventDetail({ params }: { params: PageProps<"/events/[id]">["params"] }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const user = await requireUser();
  const supabase = await createClient();

  const [{ data: event }, { data: registration }, { data: seatsLeft }, { data: ticket }] = await Promise.all([
    supabase
      .from("events")
      .select("event_id, title, description, venue, start_at, end_at, capacity, mode, reg_open_at, reg_close_at, status")
      .eq("event_id", id)
      .maybeSingle(),
    supabase
      .from("registrations")
      .select("status, waitlist_position")
      .eq("event_id", id)
      .eq("student_id", user.id)
      .maybeSingle(),
    supabase.rpc("seats_left", { p_event_id: id }),
    // The ticket secret is never selectable by the browser role, only these columns.
    supabase
      .from("tickets")
      .select("ticket_id, status, registrations!inner(event_id, student_id)")
      .eq("registrations.event_id", id)
      .eq("registrations.student_id", user.id)
      .maybeSingle(),
  ]);

  if (!event || event.status !== "published") notFound();

  const regOpen = isNowBetween(event.reg_open_at, event.reg_close_at);
  const active = registration && registration.status !== "cancelled" ? registration : null;

  const message =
    active?.status === "registered"
      ? ticket?.status === "used"
        ? "You're checked in. Enjoy the event!"
        : "You're in! Show this QR to the organiser at the door."
      : active?.status === "waitlisted"
        ? `You're on the waitlist${active.waitlist_position ? ` (#${active.waitlist_position})` : ""}. We'll promote you if a seat opens.`
        : active?.status === "pending"
          ? "Your application is pending review."
          : active?.status === "accepted"
            ? "Accepted! Show this QR to the organiser at the door."
            : active?.status === "rejected"
              ? "You were not selected for this event."
              : null;

  return (
    <article className="grid grid-cols-1 gap-5 *:min-w-0 lg:grid-cols-[1.4fr_1fr]">
      <div className="relative overflow-hidden rounded-[var(--radius-bento)] bg-amber p-6 sm:p-8">
        <Sparkle className="absolute top-6 right-6 h-10 w-10 rotate-12 text-paper" />
        <div className="flex flex-wrap items-center gap-2">
          <span className={`${monoTag} rounded-full bg-ink px-3 py-1 text-cream`}>
            {event.mode === "open" ? "open registration" : "application"}
          </span>
          <StatusBadge status={active?.status} />
        </div>
        <h1 className={`${heading} mt-5 text-4xl break-words sm:text-6xl`}>{event.title}</h1>
        <p className="mt-4 text-base font-bold">
          {formatDateTime(event.start_at)} to {formatTime(event.end_at)}
        </p>
        <p className="text-sm font-semibold">{event.venue ?? "Venue to be announced"}</p>
        {event.description && <p className="mt-5 max-w-prose whitespace-pre-line text-sm leading-6">{event.description}</p>}

        <dl className="mt-8 grid grid-cols-3 gap-3">
          {[
            ["seats left", `${seatsLeft ?? "?"}`, `of ${event.capacity}`],
            ["closes", formatTime(event.reg_close_at), formatDateTime(event.reg_close_at).split(",").slice(0, 2).join(",")],
            ["entry", "Free", "student event"],
          ].map(([k, v, sub]) => (
            <div key={k} className="rounded-3xl bg-paper/80 p-3 sm:p-4">
              <dt className={`${monoTag} text-muted`}>{k}</dt>
              <dd className="mt-1 font-display text-2xl leading-none">{v}</dd>
              <dd className="mt-1 text-[11px] text-muted">{sub}</dd>
            </div>
          ))}
        </dl>
      </div>

      <section aria-label="Registration" className="flex flex-col items-center justify-center gap-4 rounded-[var(--radius-bento)] bg-paper p-6 text-center sm:p-8">
        <p className={`${monoTag} text-muted`}>{"// your spot"}</p>
        {user.role === "student" && !user.matricNo && (
          <Link href="/profile" className="rounded-2xl bg-amber px-4 py-2 text-xs font-bold hover:bg-amber-deep">
            Add your matric number so organisers can verify you at the door &rarr;
          </Link>
        )}
        {message ? (
          <p className="max-w-xs font-display text-xl uppercase leading-tight">{message}</p>
        ) : user.role !== "student" ? (
          <p className="text-sm text-muted">Only student accounts can register for events.</p>
        ) : !regOpen ? (
          <p className="font-display text-xl uppercase">Registration is closed</p>
        ) : event.mode === "application" ? (
          <p className="text-sm text-muted">Applications with a resume open in the next release.</p>
        ) : (
          <>
            <p className="font-display text-2xl uppercase leading-tight">Grab a seat</p>
            <RegisterButton action={registerForEvent.bind(null, event.event_id)} />
          </>
        )}
        {ticket?.status === "active" && (active?.status === "registered" || active?.status === "accepted") && (
          <TicketQr ticketId={ticket.ticket_id} />
        )}
      </section>
    </article>
  );
}
