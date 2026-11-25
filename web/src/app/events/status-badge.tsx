import type { Enums } from "@/lib/database.types";

const labels: Record<Enums<"registration_status">, string> = {
  registered: "Registered",
  pending: "Pending",
  accepted: "Accepted",
  waitlisted: "Waitlisted",
  rejected: "Not selected",
  cancelled: "Cancelled",
};

export function StatusBadge({ status }: { status: Enums<"registration_status"> | undefined }) {
  if (!status || status === "cancelled") return null;
  const tone =
    status === "registered" || status === "accepted"
      ? "bg-forest text-amber"
      : status === "rejected"
        ? "bg-ink/10 text-muted"
        : "bg-ink text-cream";
  return (
    <span className={`inline-flex shrink-0 -rotate-3 items-center gap-1 rounded-full px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider ${tone}`}>
      {status === "registered" || status === "accepted" ? "✓" : "•"} {labels[status]}
    </span>
  );
}
