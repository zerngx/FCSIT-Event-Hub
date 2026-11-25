import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Sparkle } from "@/components/decor";
import { heading, monoTag } from "@/lib/ui";
import { ProfileForm } from "./profile-form";

export const metadata = { title: "My profile | FCSIT Event Hub" };

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header className="relative overflow-hidden rounded-[var(--radius-bento)] bg-forest p-6 text-cream sm:p-8">
        <Sparkle className="absolute top-6 right-8 h-10 w-10 rotate-12 text-amber" />
        <p className={`${monoTag} text-amber`}>{"// fill it in once"}</p>
        <h1 className={`${heading} mt-2 text-5xl text-amber`}>My profile</h1>
        <p className="mt-2 max-w-md text-sm text-cream/80">
          Organisers see your name, matric number and photo at the door so they can check it is really you. Your photo is private to you and the organisers of events you join.
        </p>
      </header>
      <div className="rounded-[var(--radius-bento)] bg-paper p-6 sm:p-8">
        <Suspense fallback={<p className={`${monoTag} text-muted`}>loading...</p>}>
          <ProfileLoader />
        </Suspense>
      </div>
    </div>
  );
}

async function ProfileLoader() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select("full_name, matric_no, programme, year_of_study, phone, photo_url")
    .eq("user_id", user.id)
    .single();

  let photoUrl: string | null = null;
  if (data?.photo_url) {
    const { data: signed } = await supabase.storage.from("profile-photos").createSignedUrl(data.photo_url, 3600);
    photoUrl = signed?.signedUrl ?? null;
  }

  return (
    <ProfileForm
      values={{
        fullName: data?.full_name ?? "",
        matricNo: data?.matric_no ?? "",
        programme: data?.programme ?? "",
        year: data?.year_of_study ?? null,
        phone: data?.phone ?? "",
        photoUrl,
      }}
    />
  );
}
