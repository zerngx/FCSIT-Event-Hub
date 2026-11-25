"use client";

import { useActionState } from "react";
import { btnForest } from "@/lib/ui";
import type { RegisterState } from "../actions";

export function RegisterButton({
  action,
}: {
  action: (prev: RegisterState, formData: FormData) => Promise<RegisterState>;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col items-center gap-2">
      <button type="submit" disabled={pending} className={`${btnForest} -rotate-2 px-8 py-3 text-base`}>
        {pending ? "Saving your seat..." : "Register now"}
      </button>
      {state?.error && (
        <p role="alert" className="rounded-2xl bg-cherry/10 px-4 py-2 text-sm font-semibold text-cherry">
          {state.error}
        </p>
      )}
    </form>
  );
}
