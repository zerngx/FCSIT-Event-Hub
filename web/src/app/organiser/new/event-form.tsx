"use client";

import { useActionState } from "react";
import { btnForest, input, label } from "@/lib/ui";
import { createEvent } from "../actions";

export function EventForm() {
  const [state, formAction, pending] = useActionState(createEvent, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <label className="block">
        <span className={label}>Title</span>
        <input name="title" required maxLength={150} className={input} />
      </label>
      <label className="block">
        <span className={label}>Description</span>
        <textarea name="description" rows={4} className={input} />
      </label>
      <label className="block">
        <span className={label}>Venue</span>
        <input name="venue" maxLength={120} className={input} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={label}>Starts (Malaysia time)</span>
          <input name="start_at" type="datetime-local" required className={input} />
        </label>
        <label className="block">
          <span className={label}>Ends (Malaysia time)</span>
          <input name="end_at" type="datetime-local" required className={input} />
        </label>
        <label className="block">
          <span className={label}>Registration closes</span>
          <input name="reg_close_at" type="datetime-local" required className={input} />
        </label>
        <label className="block">
          <span className={label}>Seats</span>
          <input name="capacity" type="number" min={1} max={9999} defaultValue={50} required className={input} />
        </label>
      </div>
      <label className="block">
        <span className={label}>Registration type</span>
        <select name="mode" className={input} defaultValue="open">
          <option value="open">Open: one-click registration</option>
          <option value="application">Application: resume and screening (next release)</option>
        </select>
      </label>
      {state?.error && (
        <p role="alert" className="rounded-2xl bg-cherry/10 px-4 py-2 text-sm font-semibold text-cherry">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className={btnForest}>
        {pending ? "Saving..." : "Save as draft"}
      </button>
    </form>
  );
}
