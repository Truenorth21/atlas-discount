import type { ApprovalStatus } from "@/lib/types";

export function StatusBadge({ status }: { status: ApprovalStatus | string }) {
  const styles =
    status === "approved" || status === "Ready to confirm"
      ? "bg-emerald-50 text-emerald-700"
      : status === "rejected"
        ? "bg-red-50 text-red-700"
        : "bg-amber-50 text-amber-700";

  return <span className={`badge ${styles}`}>{status}</span>;
}
