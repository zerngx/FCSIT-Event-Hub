"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function decideOrganiser(userId: string, approve: boolean) {
  if (!UUID.test(userId)) return;
  const admin = await requireAdmin();
  const supabase = await createClient();
  await supabase
    .from("users")
    .update(
      approve
        ? { role: "organiser", organiser_status: "approved", approved_by: admin.id }
        : { organiser_status: "rejected" },
    )
    .eq("user_id", userId)
    .eq("organiser_status", "pending");
  revalidatePath("/admin");
}
