import { Suspense } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/format";
import { Sparkle } from "@/components/decor";
import { btnDark, heading, input, monoTag } from "@/lib/ui";
import { RoleControl } from "./role-control";

export const metadata = { title: "Users | FCSIT Event Hub" };

const roleTone = { student: "bg-sky", organiser: "bg-forest text-amber", admin: "bg-tangerine" } as const;

export default function AdminUsersPage(props: PageProps<"/admin/users">) {
  return (
    <div className="space-y-5">
      <header className="relative overflow-hidden rounded-[var(--radius-bento)] bg-tangerine p-6 sm:p-8">
        <Sparkle className="absolute top-6 right-8 h-10 w-10 rotate-12 text-paper" />
        <p className={monoTag}>{"// admin"}</p>
        <h1 className={`${heading} mt-2 text-5xl sm:text-6xl`}>Users and roles</h1>
        <p className="mt-2 max-w-md text-sm font-semibold">Search accounts and change who is a student, organiser or admin. Every change is logged.</p>
        <Link href="/admin" className={`${monoTag} mt-4 inline-flex rounded-full bg-paper px-3 py-1.5 hover:bg-amber`}>
          &larr; organiser requests
        </Link>
      </header>
      <Suspense fallback={<p className={`${monoTag} text-muted`}>loading users...</p>}>
        <Users searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

async function Users({ searchParams }: { searchParams: PageProps<"/admin/users">["searchParams"] }) {
  const me = await requireAdmin();
  const { q: rawQ } = await searchParams;
  // Strip characters that have a meaning inside a PostgREST filter before using the text in one.
  const q = (typeof rawQ === "string" ? rawQ : "").replace(/[,()%*\\]/g, " ").trim().slice(0, 60);

  const supabase = await createClient();
  let query = supabase
    .from("users")
    .select("user_id, full_name, email, matric_no, role, organiser_status, created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  if (q) query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%,matric_no.ilike.%${q}%`);

  const [{ data: users }, { data: audit }] = await Promise.all([
    query,
    supabase
      .from("role_audit")
      .select(
        "audit_id, old_role, new_role, changed_at, subject:users!role_audit_user_id_fkey(full_name, email), actor:users!role_audit_changed_by_fkey(full_name, email)",
      )
      .order("changed_at", { ascending: false })
      .limit(6),
  ]);

  return (
    <>
      <form className="flex gap-2 rounded-full bg-paper p-1.5" role="search">
        <input name="q" defaultValue={q} placeholder="Search by name, email or matric number" aria-label="Search users" className={`${input} !rounded-full !border-0 !bg-transparent`} />
        <button className={btnDark}>Search</button>
      </form>

      <ul className="space-y-3">
        {(users ?? []).map((u) => (
          <li key={u.user_id} className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-bento)] bg-paper p-5">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber font-display">
                {(u.full_name || u.email)[0]?.toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate font-bold">{u.full_name || "No name"}</p>
                <p className="truncate font-mono text-xs text-muted">
                  {u.email}
                  {u.matric_no ? ` · ${u.matric_no}` : ""}
                </p>
                <span className={`${monoTag} mt-1 inline-block rounded-full px-2.5 py-0.5 ${roleTone[u.role]}`}>
                  {u.role}
                  {u.organiser_status === "pending" ? " · request pending" : ""}
                </span>
              </div>
            </div>
            <RoleControl userId={u.user_id} name={u.full_name || u.email} role={u.role} isSelf={u.user_id === me.id} />
          </li>
        ))}
        {!users?.length && <li className="rounded-[var(--radius-bento)] bg-paper p-8 text-sm text-muted">No users match that search.</li>}
      </ul>

      <section aria-label="Recent role changes" className="rounded-[var(--radius-bento)] bg-ink p-6 font-mono text-xs leading-6 text-cream sm:p-8">
        <p className="text-amber">{"# audit trail (latest 6)"}</p>
        {audit?.length ? (
          audit.map((a) => (
            <p key={a.audit_id}>
              {formatDateTime(a.changed_at)} · {a.actor?.full_name || a.actor?.email || "unknown"} changed{" "}
              {a.subject?.full_name || a.subject?.email || "a user"}: {a.old_role} → {a.new_role}
            </p>
          ))
        ) : (
          <p className="text-muted">no role changes yet</p>
        )}
      </section>
    </>
  );
}
