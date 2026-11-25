import { Suspense } from "react";
import Link from "next/link";
import { requireOrganiser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/format";
import { Sparkle } from "@/components/decor";
import { btnForest, heading, monoTag } from "@/lib/ui";
import { Skeleton } from "@/components/skeleton";

export const metadata = { title: "My events | FCSIT Event Hub" };

const statusTone: Record<string, string> = {
  draft: "bg-paper/70",
  published: "bg-forest text-amber",
  closed: "bg-ink text-cream",
};

export default function OrganiserPage() {
  return (
    <div className="space-y-5">
      <header className="relative flex flex-wrap items-end justify-between gap-4 overflow-hidden rounded-[var(--radius-bento)] bg-sky p-6 sm:p-8">
        <Sparkle className="absolute top-6 left-1/2 h-10 w-10 text-paper" />
        <div>
          <p className={monoTag}>{"// organiser console"}</p>
          <h1 className={`${heading} mt-2 text-5xl sm:text-6xl`}>My events</h1>
        </div>
        <Link href="/organiser/new" className={`${btnForest} -rotate-2`}>
          + New event
        </Link>
      </header>
      <Suspense fallback={<Skeleton variant="list" />}>
        <MyEvents />
      </Suspense>
    </div>
  );
}

async function MyEvents() {
  const user = await requireOrganiser();
  const supabase = await createClient();
  const { data: events } = await supabase
    .from("events")
    .select("event_id, title, start_at, status, capacity, mode")
    .eq("organiser_id", user.id)
    .order("start_at", { ascending: false });

  if (!events?.length) {
    return <p className="rounded-[var(--radius-bento)] bg-paper p-8 text-sm text-muted">No events yet. Create your first one!</p>;
  }

  return (
    <ul className="space-y-3 rounded-[var(--radius-bento)] bg-paper p-3 sm:p-4">
      {events.map((e) => (
        <li key={e.event_id}>
          <Link
            href={`/organiser/events/${e.event_id}`}
            className="flex items-center justify-between gap-3 rounded-3xl px-4 py-4 transition hover:bg-sage"
          >
            <div className="min-w-0">
              <p className="truncate font-display text-xl uppercase leading-tight">{e.title}</p>
              <p className="text-sm text-muted">
                {formatDateTime(e.start_at)} · {e.capacity} seats · {e.mode}
              </p>
            </div>
            <span className={`${monoTag} shrink-0 rounded-full px-3 py-1 ${statusTone[e.status]}`}>{e.status}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
