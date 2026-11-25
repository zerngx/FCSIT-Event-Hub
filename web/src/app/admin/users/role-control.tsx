"use client";

import { useActionState, useState } from "react";
import { btnForest, btnGhost } from "@/lib/ui";
import type { Enums } from "@/lib/database.types";
import { setUserRole, type RoleState } from "./actions";

const ROLES: Enums<"user_role">[] = ["student", "organiser", "admin"];

// Two steps: pick a role, then confirm. The server re-checks everything.
export function RoleControl({
  userId,
  name,
  role,
  isSelf,
}: {
  userId: string;
  name: string;
  role: Enums<"user_role">;
  isSelf: boolean;
}) {
  const [target, setTarget] = useState<Enums<"user_role">>(role);
  const [state, formAction, pending] = useActionState(setUserRole.bind(null, userId), undefined as RoleState);

  if (isSelf) return <span className="font-mono text-xs text-muted">you</span>;

  const changed = target !== role;

  return (
    <form action={formAction} className="flex flex-col items-end gap-2">
      <input type="hidden" name="role" value={target} />
      <div className="flex flex-wrap items-center justify-end gap-2">
        <label className="sr-only" htmlFor={`role-${userId}`}>
          Role for {name}
        </label>
        <select
          id={`role-${userId}`}
          value={target}
          onChange={(e) => setTarget(e.target.value as Enums<"user_role">)}
          className="rounded-full border-2 border-ink/15 bg-cream px-3 py-1.5 text-sm font-semibold"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        {changed && (
          <>
            <button type="submit" disabled={pending} className={btnForest}>
              {pending ? "Saving..." : `Confirm: make ${target}`}
            </button>
            <button type="button" onClick={() => setTarget(role)} className={btnGhost}>
              Cancel
            </button>
          </>
        )}
      </div>
      {state?.error && <p role="alert" className="text-xs font-semibold text-cherry">{state.error}</p>}
      {state?.done && !changed && <p className="text-xs font-semibold text-forest">{state.done}</p>}
    </form>
  );
}
