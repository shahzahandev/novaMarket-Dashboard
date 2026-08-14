import { CheckCircle2, Clock, PackageCheck, Truck, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const styles = {
  Active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Inactive: "border-slate-200 bg-slate-50 text-slate-600",
  Suspended: "border-rose-200 bg-rose-50 text-rose-700",
  Deleted: "border-rose-200 bg-rose-50 text-rose-700",
  Pending: "border-amber-200 bg-amber-50 text-amber-700",
  Processing: "border-amber-200 bg-amber-50 text-amber-700",
  Shipped: "border-cyan-200 bg-cyan-50 text-cyan-700",
  Delivered: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Cancelled: "border-rose-200 bg-rose-50 text-rose-700",
  Paid: "border-emerald-200 bg-emerald-50 text-emerald-700",
  COD: "border-indigo-200 bg-indigo-50 text-indigo-700",
  Refunded: "border-rose-200 bg-rose-50 text-rose-700",
  "Low Stock": "border-amber-200 bg-amber-50 text-amber-700",
  "Out of Stock": "border-rose-200 bg-rose-50 text-rose-700",
};

const icons = {
  Active: CheckCircle2,
  Processing: Clock,
  Pending: Clock,
  Shipped: Truck,
  Delivered: PackageCheck,
  Cancelled: XCircle,
};

export function StatusBadge({ status }) {
  const Icon = icons[status];

  return (
    <Badge className={styles[status] || "border-slate-200 bg-slate-50 text-slate-700"}>
      {Icon && <Icon className="mr-1 h-3 w-3" />}
      {status}
    </Badge>
  );
}
