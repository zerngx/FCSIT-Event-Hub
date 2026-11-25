"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type ProfileState = { error?: string; message?: string } | undefined;

export const PROGRAMMES = [
  "Artificial Intelligence",
  "Computer System and Network",
  "Data Science",
  "Information Systems",
  "Multimedia Computing",
  "Software Engineering",
] as const;

const MATRIC = /^[A-Za-z0-9/]{6,12}$/;
const PHONE = /^\+?[0-9 -]{8,16}$/;
const PHOTO_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export async function saveProfile(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const user = await requireUser();

  const fullName = String(formData.get("full_name") ?? "").trim();
  const matric = String(formData.get("matric_no") ?? "").trim().toUpperCase();
  const programme = String(formData.get("programme") ?? "").trim();
  const year = Number(formData.get("year_of_study"));
  const phone = String(formData.get("phone") ?? "").trim();

  if (!fullName || fullName.length > 100) return { error: "Enter your full name (up to 100 characters)." };
  if (matric && !MATRIC.test(matric)) return { error: "Matric number should be 6 to 12 letters or digits, for example 25006739." };
  if (programme && !(PROGRAMMES as readonly string[]).includes(programme)) return { error: "Choose a programme from the list." };
  if (!Number.isInteger(year) || year < 1 || year > 6) return { error: "Choose your year of study." };
  if (phone && !PHONE.test(phone)) return { error: "Phone number looks wrong. Use digits, spaces or dashes." };

  const supabase = await createClient();

  // Optional photo: stored privately under <user id>/, shown only to you and to organisers of events you joined.
  let photoPath: string | undefined;
  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > 0) {
    const ext = PHOTO_TYPES[photo.type];
    if (!ext) return { error: "Photo must be a JPG, PNG or WebP image." };
    if (photo.size > 2 * 1024 * 1024) return { error: "Photo must be 2 MB or smaller." };
    photoPath = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("profile-photos").upload(photoPath, photo, { contentType: photo.type });
    if (uploadError) return { error: "Could not upload the photo. Try again." };
  }

  const { data: before } = await supabase.from("users").select("photo_url").eq("user_id", user.id).single();

  const { error } = await supabase
    .from("users")
    .update({
      full_name: fullName,
      matric_no: matric || null,
      programme: programme || null,
      year_of_study: year,
      phone: phone || null,
      ...(photoPath ? { photo_url: photoPath } : {}),
    })
    .eq("user_id", user.id);

  if (error) {
    if (photoPath) await supabase.storage.from("profile-photos").remove([photoPath]);
    return {
      error: error.code === "23505" ? "That matric number is already used by another account." : "Could not save your profile.",
    };
  }

  if (photoPath && before?.photo_url && before.photo_url !== photoPath) {
    await supabase.storage.from("profile-photos").remove([before.photo_url]);
  }

  revalidatePath("/profile");
  revalidatePath("/events");
  return { message: "Profile saved." };
}
