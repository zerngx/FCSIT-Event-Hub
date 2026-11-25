"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/database.types";

export type RoleState = { error?: string; done?: string } | undefined;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ROLES: Enums<"user_role">[] = ["student", "organiser", "admin"];

// The database function re-checks that the caller is an admin, blocks self-changes and writes the audit row.
export async function setUserRole(userId: string, _prev: RoleState, formData: FormData): Promise<RoleState> {
  const role = String(formData.get("role") ?? "") as Enums<"user_role">;
  if (!UUID.test(userId) || !ROLES.includes(role)) return { error: "Invalid request." };

  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_role", { p_user_id: userId, p_role: role });
  if (error) return { error: error.message };

  revalidatePath("/admin/users");
  return { done: `Role changed to ${role}.` };
}
