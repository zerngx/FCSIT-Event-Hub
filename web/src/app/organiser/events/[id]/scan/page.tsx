import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOrganiser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Scanner } from "./scanner";
import { heading, monoTag } from "@/lib/ui";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function ScanPage(props: PageProps<"/organiser/events/[id]/scan">) {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Suspense fallback={<p className={`${monoTag} text-muted`}>loading scanner...</p>}>
        <ScanGuard params={props.params} />
      </Suspense>
    </div>
  );
}

async function ScanGuard({ params }: { params: PageProps<"/organiser/events/[id]/scan">["params"] }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const user = await requireOrganiser();
  const supabase = await createClient();
  const { data: event } = await supabase
    .from("events")
    .select("event_id, title")
    .eq("event_id", id)
    .eq("organiser_id", user.id)
    .maybeSingle();
  if (!event) notFound();

  return (
    <>
      <div>
        <Link href={`/organiser/events/${event.event_id}`} className={`${monoTag} inline-flex rounded-full bg-paper px-3 py-1.5 hover:bg-amber`}>
          &larr; {event.title}
        </Link>
        <h1 className={`${heading} mt-4 text-5xl`}>Door scanner</h1>
        <p className="mt-2 text-sm text-muted">
          Point the camera at the student&apos;s QR ticket. Compare the name and matric number with the person in front of you.
        </p>
      </div>
      <Scanner />
    </>
  );
}
