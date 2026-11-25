import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/database.types";

export type CurrentUser = {
  id: string;
  fullName: string;
  email: string;
  matricNo: string | null;
  role: Enums<"user_role">;
  organiserStatus: Enums<"organiser_status">;
};

// Data Access Layer: the single place pages and actions ask "who is signed in?".
// Verifies the session with Supabase on every call (never trusts cookies alone).
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  // Marks everything below as request-time work. Supabase compares token expiry with the
  // current time, which Next.js would otherwise flag while prerendering the static shell.
  await connection();
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("user_id, full_name, email, matric_no, role, organiser_status")
    .eq("user_id", auth.user.id)
    .single();
  if (!profile) return null;

  return {
    id: profile.user_id,
    fullName: profile.full_name,
    email: profile.email,
    matricNo: profile.matric_no,
    role: profile.role,
    organiserStatus: profile.organiser_status,
  };
});

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

// Approved organisers only. Database policies enforce the same rule; this gives a clean redirect.
export async function requireOrganiser(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== "organiser" || user.organiserStatus !== "approved") redirect("/events");
  return user;
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/events");
  return user;
}
