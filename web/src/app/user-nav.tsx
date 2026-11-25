import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { btnForest } from "@/lib/ui";
import { logout } from "./auth/actions";
import { SubmitButton } from "@/components/submit-button";

export async function UserNav() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <Link href="/signup" className="hidden text-sm font-semibold hover:underline sm:inline">
          Sign up
        </Link>
        <Link href="/login" className={`${btnForest} relative -rotate-3`}>
          Sign in
          <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[10px] text-cream">
            →
          </span>
        </Link>
      </div>
    );
  }

  const initials = (user.fullName || user.email)
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");

  return (
    <nav aria-label="Account" className="flex items-center gap-1 text-xs font-semibold whitespace-nowrap sm:gap-2 sm:text-sm">
      <Link href="/events" className="rounded-full px-2 py-2 hover:bg-paper md:hidden">
        Events
      </Link>
      {user.role === "organiser" && (
        <Link href="/organiser" className="rounded-full bg-sky px-3 py-2 transition hover:-translate-y-0.5">
          My events
        </Link>
      )}
      {user.role === "admin" && (
        <Link href="/admin" className="rounded-full bg-tangerine px-3 py-2 transition hover:-translate-y-0.5">
          Admin
        </Link>
      )}
      <Link href="/profile" aria-label="My profile" className="flex items-center gap-2 rounded-full bg-paper p-1 transition hover:bg-amber sm:pr-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber font-display text-xs" title={user.fullName || user.email}>
          {initials}
        </span>
        <span className="hidden max-w-32 truncate sm:inline">{user.fullName || user.email}</span>
        <span className="hidden font-mono text-[10px] uppercase text-muted sm:inline">{user.role}</span>
      </Link>
      <form action={logout}>
        <SubmitButton className="inline-flex items-center gap-1.5 rounded-full px-2 py-2 hover:bg-paper sm:px-3" pendingLabel="Signing out...">
          Sign out
        </SubmitButton>
      </form>
    </nav>
  );
}
