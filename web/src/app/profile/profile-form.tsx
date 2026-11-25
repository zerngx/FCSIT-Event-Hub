"use client";

import { useActionState } from "react";
import { btnForest, input, label } from "@/lib/ui";
import { PROGRAMMES } from "@/lib/programmes";
import { saveProfile } from "./actions";

type Values = {
  fullName: string;
  matricNo: string;
  programme: string;
  year: number | null;
  phone: string;
  photoUrl: string | null;
};

export function ProfileForm({ values }: { values: Values }) {
  const [state, formAction, pending] = useActionState(saveProfile, undefined);

  return (
    <form action={formAction} className="space-y-5">
      <div className="flex items-center gap-4">
        {values.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={values.photoUrl} alt="Your profile photo" width={96} height={96} className="h-24 w-24 rounded-full object-cover ring-4 ring-amber" />
        ) : (
          <span className="flex h-24 w-24 items-center justify-center rounded-full bg-amber font-display text-3xl" aria-hidden>
            {(values.fullName || "?")[0]?.toUpperCase()}
          </span>
        )}
        <label className="block flex-1">
          <span className={label}>Profile photo (JPG, PNG or WebP, up to 2 MB)</span>
          <input name="photo" type="file" accept="image/jpeg,image/png,image/webp" className="w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-ink file:px-4 file:py-2 file:text-xs file:font-bold file:text-cream" />
        </label>
      </div>

      <label className="block">
        <span className={label}>Full name</span>
        <input name="full_name" defaultValue={values.fullName} required maxLength={100} className={input} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={label}>Matric number</span>
          <input name="matric_no" defaultValue={values.matricNo} placeholder="25006739" maxLength={12} className={`${input} font-mono`} />
        </label>
        <label className="block">
          <span className={label}>Phone (optional)</span>
          <input name="phone" defaultValue={values.phone} placeholder="+6012-3456789" maxLength={16} className={input} />
        </label>
        <label className="block">
          <span className={label}>Programme</span>
          <select name="programme" defaultValue={values.programme} className={input}>
            <option value="">Choose...</option>
            {PROGRAMMES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={label}>Year of study</span>
          <select name="year_of_study" defaultValue={values.year ?? ""} required className={input}>
            <option value="" disabled>
              Choose...
            </option>
            {[1, 2, 3, 4].map((y) => (
              <option key={y} value={y}>
                Year {y}
              </option>
            ))}
          </select>
        </label>
      </div>

      {state?.error && (
        <p role="alert" className="rounded-2xl bg-cherry/10 px-4 py-2 text-sm font-semibold text-cherry">
          {state.error}
        </p>
      )}
      {state?.message && <p className="rounded-2xl bg-forest-soft px-4 py-2 text-sm font-semibold text-forest">{state.message}</p>}
      <button type="submit" disabled={pending} className={btnForest}>
        {pending ? "Saving..." : "Save profile"}
      </button>
    </form>
  );
}
