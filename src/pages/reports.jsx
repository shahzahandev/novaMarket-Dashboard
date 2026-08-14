import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export function ReportsPage({ products, orders }) {
  const productSales = products
    .map((product) => ({ name: product.title.replace("E-Earbuds ", ""), sold: product.sold }))
    .sort((a, b) => b.sold - a.sold);
  const revenue = orders.reduce((sum, order) => sum + (order.status === "Cancelled" ? 0 : order.total), 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-normal">Reports</h2>
        <p className="mt-2 text-muted-foreground">Sales performance, product demand and operation summary.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Summary title="Gross revenue" value={formatCurrency(revenue)} />
        <Summary title="Average order" value={formatCurrency(revenue / Math.max(orders.length, 1))} />
        <Summary title="Units sold" value={products.reduce((sum, item) => sum + item.sold, 0)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Product Sales</CardTitle>
          <CardDescription>Units sold by product line</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productSales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={10} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: "#f1f5f9" }} />
                <Bar dataKey="sold" fill="#0f766e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Summary({ title, value }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="mt-2 text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
