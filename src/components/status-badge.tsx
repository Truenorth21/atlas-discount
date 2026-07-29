"use client";

import type { ApprovalStatus } from "@/lib/types";
import { translateStatus, useI18n } from "@/lib/i18n";

export function StatusBadge({ status }: { status: ApprovalStatus | string }) {
  const { language } = useI18n();
  const normalized = status.toLowerCase();
  const styles =
    normalized === "approved" || normalized === "ready to confirm"
      ? "bg-emerald-50 text-emerald-700"
      : normalized === "rejected"
        ? "bg-red-50 text-red-700"
        : "bg-amber-50 text-amber-700";

  return <span className={`badge ${styles}`}>{translateStatus(status, language)}</span>;
}
