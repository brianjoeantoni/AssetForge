import { cn } from "@/lib/utils";
import type { ApiAssetStatus } from "@/lib/server-api";

const statusClasses: Record<ApiAssetStatus, string> = {
  QUEUED: "border-amber-300 bg-amber-50 text-amber-800",
  PROCESSING: "border-sky-300 bg-sky-50 text-sky-800",
  COMPLETED: "border-emerald-300 bg-emerald-50 text-emerald-800",
  FAILED: "border-red-300 bg-red-50 text-red-800"
};

export function StatusBadge({ status, className }: { status: ApiAssetStatus; className?: string }) {
  return (
    <span className={cn("inline-flex rounded-sm border px-2 py-1 text-xs font-medium", statusClasses[status], className)}>
      {status.toLowerCase()}
    </span>
  );
}
