import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Neutralise spreadsheet formulas and quote every cell.
function cell(value: string | null | undefined) {
  let text = value ?? "";
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await getCurrentUser();
  if (!user || user.role !== "organiser" || !UUID.test(id)) return new Response("Not found", { status: 404 });

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("event_attendance", { p_event_id: id });
  if (error) return new Response("Not found", { status: 404 });

  const lines = [["Name", "Matric number", "Programme", "Registration status", "Attendance", "Checked in at (UTC)"].map(cell).join(",")];
  for (const r of data ?? []) {
    const confirmed = r.status === "registered" || r.status === "accepted";
    lines.push(
      [
        r.full_name,
        r.matric_no,
        r.programme,
        r.status,
        r.attended ? "Present" : confirmed ? "Absent" : "",
        r.checked_in_at ?? "",
      ]
        .map(cell)
        .join(","),
    );
  }

  return new Response(lines.join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="attendance-${id.slice(0, 8)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
