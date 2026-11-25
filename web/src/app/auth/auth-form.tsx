"use client";

import { useActionState } from "react";
import { btnDark, input, label } from "@/lib/ui";
import type { FormState } from "./actions";

type Field = { name: string; label: string; type: string; autoComplete: string };

export function AuthForm({
  action,
  fields,
  submitLabel,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  fields: Field[];
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-4">
      {fields.map((f) => (
        <label key={f.name} className="block">
          <span className={label}>{f.label}</span>
          <input name={f.name} type={f.type} autoComplete={f.autoComplete} required className={input} />
        </label>
      ))}
      {state?.error && (
        <p role="alert" className="rounded-2xl bg-cherry/10 px-4 py-2 text-sm font-semibold text-cherry">
          {state.error}
        </p>
      )}
      {state?.message && <p className="rounded-2xl bg-forest-soft px-4 py-2 text-sm font-semibold text-forest">{state.message}</p>}
      <button type="submit" disabled={pending} className={`${btnDark} w-full py-3`}>
        {pending ? "One sec..." : submitLabel}
      </button>
    </form>
  );
}
