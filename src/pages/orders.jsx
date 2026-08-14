import { Eye, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { MetricCard } from "@/components/metric-card";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CheckCircle2, Clock, PackageCheck, Truck } from "lucide-react";
import axios from "axios";

const API_BASE = "https://emart-singlevendor-backend-6.onrender.com/api/v1";
const ALL_ORDER_URL = `${API_BASE}/order/allOrder`;

const orderStatuses = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];

export function OrdersPage({ }) {
  const [ orders, setOrders] = useState([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");


  useEffect(() => {
  async function fetchUsers() {
    let data = await axios.get(ALL_ORDER_URL);
    setOrders(data.data.order);
    console.log(orders);
    
  }
  fetchUsers()
}, [orders]);



  const stats = useMemo(() => ({
    pending: orders.filter((order) => order.status === "pending").length,
    processing: orders.filter((order) => order.status === "processing").length,
    shipped: orders.filter((order) => order.status === "shipped").length,
    delivered: orders.filter((order) => order.status === "Delivered").length,
  }), [orders]);  

  const filtered = useMemo(() => {
    return orders.filter((order) => {
      const matchesQuery = [order.id, order.customer, order.email, order.payment]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchesStatus = status === "All" || order.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [orders, query, status]);

  const updateOrderStatus = (id, nextStatus) => {
    setOrders((current) => current.map((order) => (order._id === id ? { ...order, status: nextStatus } : order)));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-normal">Orders</h2>
        <p className="mt-2 text-muted-foreground">Track payments, delivery status and fulfillment workflow.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Pending" value={stats.pending} note="Need confirmation" icon={Clock} tone="amber" />
        <MetricCard title="Processing" value={stats.processing} note="Packing queue" icon={PackageCheck} tone="cyan" />
        <MetricCard title="Shipped" value={stats.shipped} note="Courier active" icon={Truck} tone="indigo" />
        <MetricCard title="Delivered" value={stats.delivered} note="Completed orders" icon={CheckCircle2} tone="emerald" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order Management</CardTitle>
          <CardDescription>{filtered.length} orders showing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid gap-3 md:grid-cols-[1fr_170px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search order, customer or payment" value={query} onChange={(event) => setQuery(event.target.value)} />
            </div>
            <Select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option>All</option>
              {orderStatuses.map((item) => <option key={item}>{item}</option>)}
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">View</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-semibold">{order._id}</TableCell>
                  <TableCell>
                    <p className="font-medium">{order.user}</p>
                    <p className="text-xs text-muted-foreground">{order.email}</p>
                  </TableCell>
                  <TableCell>{formatDate(order.createdAt)}</TableCell>
                  <TableCell>{formatCurrency(order.totalPrice)}</TableCell>
                  <TableCell><StatusBadge status={order.tranId} /></TableCell>
                  <TableCell>
                    {order.status}
                    {/* <Select value={order.status} onChange={(event) => updateOrderStatus(order._id, event.target.value)} className="w-36">
                      {orderStatuses.map((item) => <option key={item}>{item}</option>)}
                    </Select> */}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <Button variant="outline" size="icon" aria-label="View order">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
