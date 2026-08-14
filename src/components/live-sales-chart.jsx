import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export function LiveSalesChart({ data }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Live Sales</CardTitle>
        <CardDescription>Auto updating revenue and order movement</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0891b2" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#0891b2" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="time" tickLine={false} axisLine={false} tickMargin={10} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${Math.round(value / 1000)}k`}
                width={42}
              />
              <Tooltip
                formatter={(value, name) =>
                  name === "sales" ? [formatCurrency(value), "Sales"] : [value, "Orders"]
                }
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 12px 30px rgba(15, 23, 42, 0.1)",
                }}
              />
              <Area
                type="monotone"
                dataKey="sales"
                stroke="#0891b2"
                strokeWidth={3}
                fill="url(#salesFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
