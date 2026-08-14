import { ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function MetricCard({ title, value, note, icon: Icon, tone = "cyan" }) {
  const tones = {
    cyan: "bg-cyan-50 text-cyan-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
    indigo: "bg-indigo-50 text-indigo-700",
  };

  return (
    <Card>
      <CardContent className="flex items-start justify-between p-5">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{title}</p>
          <h3 className="mt-2 text-2xl font-bold tracking-normal">{value}</h3>
          <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" />
            {note}
          </p>
        </div>
        <div className={cn("rounded-md p-2.5", tones[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}
