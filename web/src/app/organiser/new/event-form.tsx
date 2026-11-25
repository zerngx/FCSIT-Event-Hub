"use client";

import { useActionState } from "react";
import { btnForest, input, label } from "@/lib/ui";
import type { EventFormState } from "../actions";

export type EventFormValues = {
  title: string;
  description: string;
  venue: string;
  startAt: string; // datetime-local value, Malaysia time
  endAt: string;
  regCloseAt: string;
  capacity: number;
  mode: "open" | "application";
};

// Used for both "new event" and "edit event". The server action is passed in already bound.
export function EventForm({
  action,
  initial,
  submitLabel,
  modeLocked = false,
  minCapacity = 1,
}: {
  action: (prev: EventFormState, formData: FormData) => Promise<EventFormState>;
  initial?: EventFormValues;
  submitLabel: string;
  modeLocked?: boolean;
  minCapacity?: number;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <label className="block">
        <span className={label}>Title</span>
        <input name="title" defaultValue={initial?.title} required maxLength={150} className={input} />
      </label>
      <label className="block">
        <span className={label}>Description</span>
        <textarea name="description" defaultValue={initial?.description} rows={4} className={input} />
      </label>
      <label className="block">
        <span className={label}>Venue</span>
        <input name="venue" defaultValue={initial?.venue} maxLength={120} className={input} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={label}>Starts (Malaysia time)</span>
          <input name="start_at" type="datetime-local" defaultValue={initial?.startAt} required className={input} />
        </label>
        <label className="block">
          <span className={label}>Ends (Malaysia time)</span>
          <input name="end_at" type="datetime-local" defaultValue={initial?.endAt} required className={input} />
        </label>
        <label className="block">
          <span className={label}>Registration closes</span>
          <input name="reg_close_at" type="datetime-local" defaultValue={initial?.regCloseAt} required className={input} />
        </label>
        <label className="block">
          <span className={label}>Seats{minCapacity > 1 ? ` (at least ${minCapacity}, already taken)` : ""}</span>
          <input name="capacity" type="number" min={minCapacity} max={9999} defaultValue={initial?.capacity ?? 50} required className={input} />
        </label>
      </div>
      <label className="block">
        <span className={label}>Registration type</span>
        {modeLocked && <input type="hidden" name="mode" value={initial?.mode} />}
        <select name={modeLocked ? undefined : "mode"} defaultValue={initial?.mode ?? "open"} disabled={modeLocked} className={`${input} disabled:opacity-60`}>
          <option value="open">Open: one-click registration</option>
          <option value="application">Application: resume and screening (next release)</option>
        </select>
        {modeLocked && <span className="mt-1 block text-xs text-muted">Locked because people have already registered.</span>}
      </label>
      {state?.error && (
        <p role="alert" className="rounded-2xl bg-cherry/10 px-4 py-2 text-sm font-semibold text-cherry">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className={btnForest}>
        {pending ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
