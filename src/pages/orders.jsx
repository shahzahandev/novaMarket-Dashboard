import { CircleX, Eye, Search, X, Share2, Check } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { MetricCard } from "@/components/metric-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CheckCircle2, Clock, PackageCheck, Truck } from "lucide-react";
import axios from "axios";

const API_BASE = "https://nova-market-backend-2.onrender.com/api/v1";
const ALL_ORDER_URL = `${API_BASE}/order/allOrder`;
const UPDATE_STATUS_URL = (id) => `${API_BASE}/order/updateStatus/${id}`;

// value = backend value (lowercase), label = UI te ja dekhabe
const orderStatuses = [
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [copied, setCopied] = useState(false);

  // =========================
  // Fetch all orders (shudhu ekbar)
  // =========================
  useEffect(() => {
    async function fetchOrders() {
      try {
        setLoading(true);
        setError("");
        const res = await axios.get(ALL_ORDER_URL);
        setOrders(res.data.order || res.data.orders || []);
      } catch (err) {
        console.error("Fetch orders error:", err);
        setError(err.response?.data?.message || "Could not load orders.");
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  const stats = useMemo(
    () => ({
      pending: orders.filter((o) => o.status === "pending").length,
      processing: orders.filter((o) => o.status === "processing").length,
      shipped: orders.filter((o) => o.status === "shipped").length,
      delivered: orders.filter((o) => o.status === "delivered").length,
      cancelled: orders.filter((o) => o.status === "cancelled").length,
    }),
    [orders]
  );

  const filtered = useMemo(() => {
    const q = query.toLowerCase();

    return orders.filter((order) => {
      const matchesQuery = [
        order._id,
        order.shipping?.name,
        order.shipping?.email,
        order.shipping?.phone,
        order.paymentMethod,
        order.tranId,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);

      const matchesStatus = status === "all" || order.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [orders, query, status]);

  // =========================
  // Update status (API call)
  // =========================
  const updateOrderStatus = async (id, nextStatus) => {
    const previous = orders.find((o) => o._id === id)?.status;
    if (previous === nextStatus) return;

    // Optimistic update
    setOrders((current) =>
      current.map((o) => (o._id === id ? { ...o, status: nextStatus } : o))
    );

    try {
      setUpdatingId(id);
      setError("");

      await axios.patch(UPDATE_STATUS_URL(id), { status: nextStatus });
    } catch (err) {
      console.error("Update status error:", err);

      // Fail hole ager status e fire jao
      setOrders((current) =>
        current.map((o) => (o._id === id ? { ...o, status: previous } : o))
      );

      setError(err.response?.data?.message || "Could not update order status.");
    } finally {
      setUpdatingId(null);
    }
  };

  // =========================
  // Share order info
  // =========================
  const buildShareText = (order) => {
    const lines = [
      `Order #${String(order._id).slice(-8).toUpperCase()}`,
      `Date: ${formatDate(order.createdAt)}`,
      `Status: ${order.status}`,
      "",
      `Customer: ${order.shipping?.name}`,
      `Phone: ${order.shipping?.phone}`,
      `Email: ${order.shipping?.email}`,
      `Address: ${order.shipping?.address}, ${order.shipping?.city} ${order.shipping?.postcode}`,
      "",
      "Products:",
      ...(order.products || []).map(
        (p) => `- ${p.title} x${p.quantity} = ${formatCurrency(p.totalPrice)}`
      ),
      "",
      `Subtotal: ${formatCurrency(order.subTotal)}`,
      `Delivery: ${formatCurrency(order.deliveryCharge)}`,
      `Total: ${formatCurrency(order.totalPrice)}`,
      `Payment: ${String(order.paymentMethod).toUpperCase()}`,
    ];

    if (order.paymentMethod !== "cod" && order.tranId) {
      lines.push(`Transaction ID: ${order.tranId}`);
    }

    return lines.join("\n");
  };

  const handleShare = async (order) => {
    const text = buildShareText(order);

    // Mobile/supported browser: native share sheet
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Order #${String(order._id).slice(-8).toUpperCase()}`,
          text,
        });
        return;
      } catch (err) {
        if (err.name === "AbortError") return; // user cancel korle kichu korbe na
      }
    }

    // Fallback: clipboard e copy
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not share or copy order info.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h2 className="text-3xl font-bold tracking-normal">Orders</h2>
          <span className="rounded-lg bg-primary px-3 py-1 text-lg font-semibold text-primary-foreground">
            {orders.length}
          </span>
        </div>
        <p className="mt-2 text-muted-foreground">
          Track payments, delivery status and fulfillment workflow.
        </p>
      </div>

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard title="Pending" value={stats.pending} note="Need confirmation" icon={Clock} tone="amber" />
        <MetricCard title="Processing" value={stats.processing} note="Packing queue" icon={PackageCheck} tone="cyan" />
        <MetricCard title="Shipped" value={stats.shipped} note="Courier active" icon={Truck} tone="indigo" />
        <MetricCard title="Delivered" value={stats.delivered} note="Completed orders" icon={CheckCircle2} tone="emerald" />
        <MetricCard title="Cancelled" value={stats.cancelled} note="Cancelled orders" icon={CircleX} tone="rose" />
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
              <Input
                className="pl-9"
                placeholder="Search order, customer or payment"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">All</option>
              {orderStatuses.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </Select>
          </div>

          {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

          {loading ? (
            <p className="py-6 text-sm text-muted-foreground">Loading orders...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Order Date</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Pay Method</TableHead>
                  <TableHead>Pay status</TableHead>
                  <TableHead>Transac ID</TableHead>
                  <TableHead>Delivery Area</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">View</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((order) => (
                  <TableRow key={order._id}>
                    <TableCell>
                      <p className="font-medium">{order.shipping?.name}</p>
                      <p className="text-xs text-muted-foreground">{order.shipping?.email}</p>
                    </TableCell>
                    <TableCell>{formatDate(order.createdAt)}</TableCell>
                    <TableCell>{formatCurrency(order.totalPrice)}</TableCell>
                    <TableCell className="capitalize">{order.paymentMethod}</TableCell>
                     <TableCell className="capitalize">{order.paymentStatus}</TableCell>
                    <TableCell>
                      {order.paymentMethod === "cod" ? "Not Available" : order.tranId}
                    </TableCell>
                    <TableCell className="capitalize">{order.deliveryArea} Dhaka</TableCell>
                    <TableCell>
                      <Select
                        value={order.status}
                        disabled={updatingId === order._id}
                        onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                        className="w-36"
                      >
                        {orderStatuses.map((s) => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          size="icon"
                          aria-label="View order"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                      No orders found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* =========================
          Order Details Modal (static, share only)
      ========================= */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-background p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold">Order Details</h3>
                <p className="text-xs text-muted-foreground">
                  #{String(selectedOrder._id).slice(-8).toUpperCase()} · {formatDate(selectedOrder.createdAt)}
                </p>
              </div>
              <Button variant="outline" size="icon" aria-label="Close" onClick={() => setSelectedOrder(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border p-4 text-sm">
                <p className="mb-2 font-semibold">Shipping</p>
                <p>{selectedOrder.shipping?.name}</p>
                <p className="text-muted-foreground">{selectedOrder.shipping?.phone}</p>
                <p className="text-muted-foreground">{selectedOrder.shipping?.email}</p>
                <p className="mt-2">
                  {selectedOrder.shipping?.address}, {selectedOrder.shipping?.city}{" "}
                  {selectedOrder.shipping?.postcode}
                </p>
              </div>

              <div className="rounded-xl border p-4 text-sm">
                <p className="mb-2 font-semibold">Payment & Delivery</p>
                <p>Method: <span className="uppercase">{selectedOrder.paymentMethod}</span></p>
                <p>
                  Transaction:{" "}
                  {selectedOrder.paymentMethod === "cod" ? "Not Available" : selectedOrder.tranId}
                </p>
                <p className="capitalize">Area: {selectedOrder.deliveryArea} Dhaka</p>
                <p className="mt-2 capitalize">
                  Status: <span className="font-semibold">{selectedOrder.status}</span>
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border">
              <p className="border-b px-4 py-3 text-sm font-semibold">
                Products ({selectedOrder.products?.length || 0})
              </p>
              <ul className="divide-y text-sm">
                {(selectedOrder.products || []).map((item) => (
                  <li key={item._id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.sku} · Qty {item.quantity} × {formatCurrency(item.discountPrice ?? item.price)}
                      </p>
                    </div>
                    <span className="font-semibold">{formatCurrency(item.totalPrice)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(selectedOrder.subTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery charge</span>
                <span>{formatCurrency(selectedOrder.deliveryCharge)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 text-base font-bold">
                <span>Total</span>
                <span>{formatCurrency(selectedOrder.totalPrice)}</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                Close
              </Button>
              <Button onClick={() => handleShare(selectedOrder)}>
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" /> Copied
                  </>
                ) : (
                  <>
                    <Share2 className="mr-2 h-4 w-4" /> Share
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}