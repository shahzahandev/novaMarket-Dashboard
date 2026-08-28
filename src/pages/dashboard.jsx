import {
  AlertTriangle,
  BadgeDollarSign,
  Package,
  ShoppingBag,
  TrendingUp,
  Users,
} from "lucide-react";
import { LiveSalesChart } from "@/components/live-sales-chart";
import { MetricCard } from "@/components/metric-card";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = "https://nova-market-backend-2.onrender.com/api/v1";
const ALL_USERS_URL = `${API_BASE}/user/allUsers`;
const ALL_PRODUCTS_URL = `${API_BASE}/product/allProduct`;
const ALL_ORDER_URL = `${API_BASE}/order/allOrder`;

export function DashboardPage({ products, users, orders, chartData, activity }) {
  const [userList, setUserList] = useState([]);
  const [productList, setProductList] = useState([]);
  const [orderList, setOrderList] = useState([]);

  const revenue = orderList
    .filter((orderList) => orderList.status == "Delivered")
    .reduce((sum, orderList) => sum + orderList.totalPrice, 0);

  const lowStock = products.filter((product) => product.stock <= 8).length;
  const delivered = orders.filter((order) => order.status === "Delivered").length;


  useEffect(() => {
    async function fetchUsers() {
      let data = await axios.get(ALL_USERS_URL);
      setUserList(data.data.userData);
    }
    fetchUsers()
  }, []);


  useEffect(() => {
    async function fetchUsers() {
      let data = await axios.get(ALL_PRODUCTS_URL);
      setProductList(data.data.allProduct);
    }
    fetchUsers()
  }, []);


  useEffect(() => {
    async function fetchUsers() {
      let data = await axios.get(ALL_ORDER_URL);
      setOrderList(data.data.order);
    }
    fetchUsers()
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-primary">Nova-Market control room</p>
          <h2 className="mt-1 text-3xl font-bold tracking-normal">Dashboard</h2>
          <p className="mt-2 text-muted-foreground">Products, customers, orders, revenue and inventory at a glance.</p>
        </div>
        <div className="rounded-md border bg-card px-4 py-2 text-sm font-medium">
          Live mode: <span className="text-emerald-600">Running</span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Revenue" value={formatCurrency(revenue)} icon={BadgeDollarSign} tone="emerald" />
        <MetricCard title="Orders" value={orderList.length} note={`${delivered} delivered`} icon={ShoppingBag} tone="cyan" />
        <MetricCard title="Products" value={productList.length} note={`${lowStock} need attention`} icon={Package} tone="amber" />
        <MetricCard title="Customers" value={userList.length} note="new leads" icon={Users} tone="indigo" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
        <LiveSalesChart data={chartData} />
        <Card>
          <CardHeader>
            <CardTitle>Store Pulse</CardTitle>
            <CardDescription>Tasks that usually matter in a dashboard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <PulseItem icon={TrendingUp} title="Conversion rate" value="7.8%" tone="text-emerald-600" />
            <PulseItem icon={AlertTriangle} title="Low stock alerts" value={lowStock} tone="text-amber-600" />
            <PulseItem icon={ShoppingBag} title="Pending orders" value={orderList.filter((o) => o.status === "Pending").length} tone="text-cyan-700" />
            <div className="rounded-md border bg-muted/30 p-3">
              <p className="text-sm font-semibold">Recent activity</p>
              <div className="mt-3 space-y-2">
                {activity.map((item) => (
                  <p key={item} className="text-sm text-muted-foreground">{item}</p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>Latest customer orders and fulfillment state</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orderList.slice(0, 5).map((order) => (
                <TableRow key={order._id}>
                  <TableCell className="font-semibold">{order._id}</TableCell>
                  <TableCell>model a set kori nai</TableCell>
                  <TableCell>{formatCurrency(order.totalPrice)}</TableCell>
                  <TableCell><StatusBadge status={order.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function PulseItem({ icon: Icon, title, value, tone }) {
  return (
    <div className="flex items-center justify-between rounded-md border p-3">
      <div className="flex items-center gap-3">
        <Icon className={`h-5 w-5 ${tone}`} />
        <p className="text-sm font-medium">{title}</p>
      </div>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}
