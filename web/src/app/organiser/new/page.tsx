import { Suspense } from "react";
import Link from "next/link";
import { requireOrganiser } from "@/lib/auth";
import { heading, monoTag } from "@/lib/ui";
import { EventForm } from "./event-form";

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
        <Suspense fallback={<p className={`${monoTag} text-muted`}>loading...</p>}>
          <Guarded />
        </Suspense>
      </div>
    </div>
  );
}

async function Guarded() {
  await requireOrganiser();
  return <EventForm />;
}
