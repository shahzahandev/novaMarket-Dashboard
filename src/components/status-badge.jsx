import { CheckCircle2, Clock, PackageCheck, Truck, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const styles = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
  inactive: "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
  suspended: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300",
  deleted: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300",
  pending: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
  processing: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
  shipped: "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-800 dark:bg-cyan-950/50 dark:text-cyan-300",
  delivered: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
  cancelled: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300",
  paid: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
  cod: "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300",
  refunded: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300",
  "low stock": "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
  "out of stock": "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300",
};

const icons = {
  active: CheckCircle2,
  processing: Clock,
  pending: Clock,
  shipped: Truck,
  delivered: PackageCheck,
  cancelled: XCircle,
};

export function StatusBadge({ status }) {
  const normalizedStatus = String(status || "").trim().toLowerCase();
  const Icon = icons[normalizedStatus];
  const label = normalizedStatus ? normalizedStatus[0].toUpperCase() + normalizedStatus.slice(1) : "Unknown";

  return (
    <Badge className={styles[normalizedStatus] || "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"}>
      {Icon && <Icon className="mr-1 h-3 w-3" />}
      {label}
    </Badge>
  );
}
