import { Suspense } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Sparkle } from "@/components/decor";
import { btnForest, btnGhost, heading, monoTag } from "@/lib/ui";
import { decideOrganiser } from "./actions";
import { Skeleton } from "@/components/skeleton";
import { SubmitButton } from "@/components/submit-button";

export const metadata = { title: "Admin | FCSIT Event Hub" };

export default function AdminPage() {
  return (
    <div className="space-y-5">
      <header className="relative overflow-hidden rounded-[var(--radius-bento)] bg-tangerine p-6 sm:p-8">
        <Sparkle className="absolute top-6 right-8 h-10 w-10 rotate-12 text-paper" />
        <p className={monoTag}>{"// admin"}</p>
        <h1 className={`${heading} mt-2 text-5xl sm:text-6xl`}>Organiser requests</h1>
        <p className="mt-2 max-w-md text-sm font-semibold">Approve student societies and staff who should be able to create events.</p>
        <Link href="/admin/users" className={`${monoTag} mt-4 inline-flex rounded-full bg-paper px-3 py-1.5 hover:bg-amber`}>
          manage all users and roles &rarr;
        </Link>
      </header>
      <Suspense fallback={<Skeleton variant="list" />}>
        <PendingList />
      </Suspense>
    </div>
  );
}

async function PendingList() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: pending } = await supabase
    .from("users")
    .select("user_id, full_name, email, matric_no, created_at")
    .eq("organiser_status", "pending")
    .order("created_at", { ascending: true });

  if (!pending?.length) {
    return <p className="rounded-[var(--radius-bento)] bg-paper p-8 text-sm text-muted">Inbox zero. No pending requests.</p>;
  }

  return (
    <ul className="space-y-3">
      {pending.map((p) => (
        <li key={p.user_id} className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-bento)] bg-paper p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber font-display">
              {(p.full_name || p.email)[0]?.toUpperCase()}
            </span>
            <div>
              <p className="font-bold">{p.full_name || "No name"}</p>
              <p className="font-mono text-xs text-muted">
                {p.email}
                {p.matric_no ? ` · ${p.matric_no}` : ""}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <form action={decideOrganiser.bind(null, p.user_id, true)}>
              <SubmitButton className={btnForest} pendingLabel="Approving...">Approve</SubmitButton>
            </form>
            <form action={decideOrganiser.bind(null, p.user_id, false)}>
              <SubmitButton className={btnGhost} pendingLabel="Rejecting...">Reject</SubmitButton>
            </form>
          </div>
        </li>
      ))}
    </ul>
  );
}
