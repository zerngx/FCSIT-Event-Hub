import { Suspense } from "react";
import Link from "next/link";
import { requireOrganiser } from "@/lib/auth";
import { heading, monoTag } from "@/lib/ui";
import { createEvent } from "../actions";
import { EventForm } from "./event-form";
import { Skeleton } from "@/components/skeleton";

export const metadata = { title: "New event | FCSIT Event Hub" };

export default function NewEventPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link href="/organiser" className={`${monoTag} inline-flex rounded-full bg-paper px-3 py-1.5 hover:bg-amber`}>
        &larr; my events
      </Link>
      <div className="rounded-[var(--radius-bento)] bg-paper p-6 sm:p-8">
        <p className={`${monoTag} text-muted`}>{"// create"}</p>
        <h1 className={`${heading} mt-1 mb-6 text-5xl`}>New event</h1>
        <Suspense fallback={<Skeleton variant="form" />}>
          <Guarded />
        </Suspense>
      </div>
    </div>
  );
}

async function Guarded() {
  await requireOrganiser();
  return <EventForm action={createEvent} submitLabel="Save as draft" />;
}
