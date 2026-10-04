import { RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";

const API_BASE = "https://nova-market-backend-2.onrender.com/api/v1";
const ALL_ORDERS_URL = `${API_BASE}/order/allOrder`;


const getReportDate = (order) => order.deliveredAt || order.updatedAt || order.createdAt || "";
const isDelivered = (order) => String(order.status || "").toLowerCase() === "delivered";

const toMonthKey = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const currentMonthKey = () => toMonthKey(new Date());

const monthLabel = (key) => {
  const [year, month] = key.split("-").map(Number);
  if (!year || !month) return "";
  return new Date(year, month - 1, 1).toLocaleString("en-GB", { month: "long", year: "numeric" });
};

const shorten = (text, max = 24) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);

// Backend paginated, tai sob page ekshathe niye ashchi
async function fetchAllOrders() {
  const all = [];
  let page = 1;
  let totalPages = 1;

  do {
    const response = await fetch(`${ALL_ORDERS_URL}?page=${page}&limit=100`);
    if (!response.ok) throw new Error("Failed to load orders");

    const data = await response.json();
    const list = data.order || data.orders || data.data || [];
    if (Array.isArray(list)) all.push(...list);

    totalPages = Math.min(Number(data.totalPages) || 1, 100);
    page += 1;
  } while (page <= totalPages);

  return all;
}

export function ReportsPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [month, setMonth] = useState(currentMonthKey());

  const loadOrders = async () => {
    setLoading(true);
    setError("");

    try {
      setOrders(await fetchAllOrders());
    } catch (err) {
      setError("Orders load kora jayni. Backend endpoint/CORS check korte hobe.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const report = useMemo(() => {
    // Shudhu selected month er delivered order
    const delivered = orders.filter((order) => isDelivered(order) && toMonthKey(getReportDate(order)) === month);

    // Gross revenue = delivered order gulor cart total (subTotal, delivery charge chhara)
    const revenue = delivered.reduce((sum, order) => sum + (Number(order.subTotal) || 0), 0);

    const sales = new Map();
    let unitsSold = 0;

    delivered.forEach((order) => {
      (order.products || []).forEach((item) => {
        const quantity = Number(item.quantity) || 0;
        const key = item.sku || item.title;

        unitsSold += quantity;
        sales.set(key, {
          name: item.title || "Unnamed product",
          sold: (sales.get(key)?.sold || 0) + quantity,
        });
      });
    });

    // Sobcheye beshi sell howa product prothome
    const productSales = [...sales.values()]
      .sort((a, b) => b.sold - a.sold)
      .map((item) => ({ ...item, label: shorten(item.name) }));

    return {
      deliveredCount: delivered.length,
      revenue,
      average: revenue / Math.max(delivered.length, 1),
      unitsSold,
      productSales,
    };
  }, [orders, month]);

  const chartHeight = Math.max(340, report.productSales.length * 44 + 40);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-normal">Reports</h2>
          <p className="mt-2 text-muted-foreground">
            Delivered orders summary for <span className="font-semibold">{monthLabel(month) || "selected month"}</span>.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="w-full sm:w-52">
            <Input
              type="month"
              value={month}
              max={currentMonthKey()}
              onChange={(event) => setMonth(event.target.value || currentMonthKey())}
              aria-label="Select month"
            />
          </div>
          <Button variant="outline" onClick={loadOrders} disabled={loading}>
            <RefreshCw className="h-4 w-4" />
            {loading ? "Loading..." : "Reload API"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error}
        </div>
      )}

      <div className="grid gap-4 grid-cols-3 md:grid-cols-3">
        <Summary title="Total sell" value={formatCurrency(report.revenue)} hint="Cart total of delivered orders" />
        <Summary
          title="Average order"
          value={formatCurrency(report.average)}
          hint={`From ${report.deliveredCount} delivered ${report.deliveredCount === 1 ? "order" : "orders"}`}
        />
        <Summary title="Units sold" value={report.unitsSold} hint="Item quantity in delivered orders" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Product Sales</CardTitle>
          <CardDescription>Units sold by product, best seller first</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && !orders.length ? (
            <p className="text-sm text-muted-foreground">Loading orders...</p>
          ) : report.productSales.length ? (
            <div style={{ height: chartHeight }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={report.productSales} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={150}
                    interval={0}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "#f1f5f9" }}
                    labelFormatter={(label, payload) => payload?.[0]?.payload?.name ?? label}
                    formatter={(value) => [value, "Units sold"]}
                  />
                  <Bar dataKey="sold" fill="#0f766e" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No delivered orders found for this month.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Summary({ title, value, hint }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="mt-2 text-2xl font-bold">{value}</p>
        {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}
