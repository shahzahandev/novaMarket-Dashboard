import {
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  Trash2,
  UserCheck,
  Heart,
  PackageCheck,
  Edit3,
  Eye,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";

const API_BASE = "https://nova-market-backend-2.onrender.com/api/v1";
const ALL_USERS_URL = `${API_BASE}/user/allUsers`;
const ALL_DELETED_USERS_URL = `${API_BASE}/user/allDeleteUser`;
const singleUserUrl = (id) => `${API_BASE}/user/singleUser/${id}`;
const updateUserUrl = (id) => `${API_BASE}/user/updateUser/${id}`;
const deleteUserUrl = (id) => `${API_BASE}/user/deleteUser/${id}`;
const singleWishlistUrl = (id) => `${API_BASE}/wishlist/singleWishlist/${id}`;
const singleUserOrdersUrl = (id) => `${API_BASE}/order/getSingleUserOrders/${id}`;

function normalizeStatus(status) {
  const value = String(status || "active").toLowerCase();

  const statuses = {
    active: "Active",
    delete: "Deleted",
    deleted: "Deleted",
  };
  return statuses[value] || "Active";
}

function backendStatus(status) {
  const value = String(status || "Active").toLowerCase();
  if (value === "deleted") return "delete";
  return value;
}

function normalizeUser(user) {
  return {
    id: user._id || user.id || `usr-${Date.now()}`,
    name: user.name || "Unnamed user",
    email: user.email || "N/A",
    phone: user.phone || "Not Available",
    city: user.city || user.address || "No Address",
    address: user.address || user.city || "No Address",
    role: user.role || "Customer",
    status: normalizeStatus(user.status),
    isHold: Boolean(user.isHold),
    joined: user.createdAt || user.joined || "",
    totalSpent: Number(user.totalSpent ?? 0),
    raw: user,
  };
}

function extractUsers(data) {
  return data.users || data.userData || data.deletedUsers || data.user || data.data || [];
}

function normalizeWishlistItem(item, index) {
  const product = item.productId || item.product || item;
  const images = Array.isArray(product?.images) ? product.images : [];
  const mainImage = images.find((img) => img.isMain) || images[0];

  return {
    id: item._id || item.id || `wl-${index}`,
    name: product?.title || product?.name || item.name || "Unnamed product",
    price: Number(product?.discountPrice ?? product?.price ?? item.price ?? 0),
    originalPrice: Number(product?.price ?? 0),
    hasDiscount:
      product?.discountType && product.discountType !== "none" && Number(product?.discountPrice ?? 0) < Number(product?.price ?? 0),
    image: mainImage?.url || product?.image || item.image || "",
    addedAt: item.createdAt || item.addedAt || "",
  };
}

function extractWishlistItems(data) {
  const list =
    data.data ||
    data.wishlist?.products ||
    data.wishlist?.items ||
    data.products ||
    data.items ||
    (Array.isArray(data.wishlist) ? data.wishlist : null) ||
    [];
  return Array.isArray(list) ? list : [];
}

// Backend order response ke UI er jonno ek format e ana
function normalizeOrder(order, index) {
  return {
    id: order._id || order.id || `ord-${index}`,
    tranId: order.tranId || order.orderId || "",
    total: Number(order.totalPrice ?? order.total ?? order.totalAmount ?? 0),
    status: order.status || order.orderStatus || "Pending",
    date: order.createdAt || order.date || "",
  };
}

function extractOrders(data) {
  const list = data.orders || data.order || data.data || data.userOrders || [];
  return Array.isArray(list) ? list : [];
}

export function UsersPage({ users, setUsers }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState("active");
  const [wishlist, setWishlist] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [userOrders, setUserOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // User e click ba eye icon e click korle popup khulbe
  const selectUser = (id) => {
    setSelectedUserId(id);
    setDetailsOpen(true);
  };

  const closeDetails = () => {
    setDetailsOpen(false);
    setSelectedUserId(null);
    setSelectedUser(null);
  };

  const fetchUsers = async (mode = viewMode) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(mode === "deleted" ? ALL_DELETED_USERS_URL : ALL_USERS_URL);
      if (!response.ok) throw new Error("Failed to load users");

      const data = await response.json();
      const userList = extractUsers(data);
      const normalized = Array.isArray(userList) ? userList.map(normalizeUser) : [];
      setUsers(normalized);
    } catch (err) {
      setError("Live API theke user load kora jayni. Demo data ekhono dekhacche.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers("active");
  }, []);

  // Popup khola thakle Esc chaple bondho hobe + background scroll lock
  useEffect(() => {
    if (!detailsOpen) return;

    const onKeyDown = (event) => {
      if (event.key === "Escape") closeDetails();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [detailsOpen]);

  useEffect(() => {
    async function fetchSingleUser() {
      if (!selectedUserId) {
        setSelectedUser(null);
        return;
      }

      const localUser = users.find((user) => user.id === selectedUserId);
      setSelectedUser(localUser || null);
      setDetailsLoading(true);

      try {
        const response = await fetch(singleUserUrl(selectedUserId));
        if (!response.ok) throw new Error("Failed to load single user");

        const data = await response.json();
        const userData = data.user || data.singleUser || data.data;
        if (userData) setSelectedUser(normalizeUser(userData));
      } catch (err) {
        console.error(err);
      } finally {
        setDetailsLoading(false);
      }
    }

    fetchSingleUser();
  }, [selectedUserId, users]);

  useEffect(() => {
    async function fetchWishlist() {
      if (!selectedUserId) {
        setWishlist([]);
        return;
      }

      setWishlistLoading(true);

      try {
        const response = await fetch(singleWishlistUrl(selectedUserId));
        if (!response.ok) throw new Error("Failed to load wishlist");

        const data = await response.json();
        const items = extractWishlistItems(data);
        setWishlist(items.map(normalizeWishlistItem));
      } catch (err) {
        setWishlist([]);
        console.error(err);
      } finally {
        setWishlistLoading(false);
      }
    }

    fetchWishlist();
  }, [selectedUserId]);

  // Selected user er order gulo backend theke ana
  useEffect(() => {
    async function fetchUserOrders() {
      if (!selectedUserId) {
        setUserOrders([]);
        return;
      }

      setOrdersLoading(true);

      try {
        const response = await fetch(singleUserOrdersUrl(selectedUserId));
        if (!response.ok) throw new Error("Failed to load user orders");

        const data = await response.json();
        setUserOrders(extractOrders(data).map(normalizeOrder));
      } catch (err) {
        setUserOrders([]);
        console.error(err);
      } finally {
        setOrdersLoading(false);
      }
    }

    fetchUserOrders();
  }, [selectedUserId]);

  const filtered = useMemo(() => {
    return users.filter((user) => {
      const matchesQuery = [user.name, user.email, user.phone, user.city, user.address]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchesStatus = status === "All" || user.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [users, query, status]);

  const selected = selectedUser || users.find((user) => user.id === selectedUserId) || null;

  const updateStatus = async (id, nextStatus) => {
    setError("");

    try {
      const response = await fetch(updateUserUrl(id), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: backendStatus(nextStatus) }),
      });

      if (!response.ok) throw new Error("Failed to update user");

      setUsers((current) =>
        current.map((user) => (user.id === id ? { ...user, status: normalizeStatus(nextStatus) } : user)),
      );
      if (selectedUserId === id) {
        setSelectedUser((current) =>
          current ? { ...current, status: normalizeStatus(nextStatus) } : current,
        );
      }
    } catch (err) {
      setError("User update hoyni. Backend endpoint/auth/CORS check korte hobe.");
      console.error(err);
    }
  };

  const removeUser = async (id) => {
    setError("");

    try {
      const response = await fetch(deleteUserUrl(id), { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete user");

      setUsers((current) => current.filter((user) => user.id !== id));
      if (selectedUserId === id) closeDetails();
    } catch (err) {
      setError("User delete hoyni. Backend endpoint/auth/CORS check korte hobe.");
      console.error(err);
    }
  };

  const changeMode = (mode) => {
    setViewMode(mode);
    setStatus(mode === "deleted" ? "Deleted" : "All");
    closeDetails();
    fetchUsers(mode);
  };

  // Table (desktop) ar card (mobile) duitay ekoi action buttons
  const renderActions = (user) => (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={() => selectUser(user.id)}
        aria-label="View user details"
      >
        <Eye className="h-4 w-4" />
      </Button>

      {viewMode !== "deleted" && (
        <>
          <Button
            variant="outline"
            size="icon"
            onClick={() => updateStatus(user.id, user.status === "Active" ? "Suspended" : "Active")}
            aria-label="Toggle user status"
          >
            {user.status === "Active" ? <Edit3 className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-rose-600"
            onClick={() => removeUser(user.id)}
            aria-label="Delete user"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </>
      )}
    </>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-normal sm:text-3xl">Users</h2>
            <span className="rounded-lg bg-primary px-3 py-1 text-lg font-semibold text-primary-foreground">
              {users.length}
            </span>
          </div>
          <p className="mt-2 text-muted-foreground">Customer list, account status and order history.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant={viewMode === "active" ? "default" : "outline"} onClick={() => changeMode("active")}>
            All Users
          </Button>
          <Button variant="outline" onClick={() => fetchUsers()} disabled={loading}>
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

      {/* ================= User Management: full width ================= */}
      <Card className="w-full min-w-0">
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription><span className="font-bold">{filtered.length}</span> customers showing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid gap-3 md:grid-cols-[1fr_170px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search user, email, phone or address"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <Select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option>All</option>
              <option>Active</option>
              <option>Inactive</option>
            </Select>
          </div>

          {/* ================= Mobile: card list ================= */}
          <div className="space-y-3 md:hidden">
            {filtered.map((user) => (
              <div
                key={user.id}
                className={`rounded-lg border p-3 ${selected?.id === user.id ? "bg-accent/45" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <button className="min-w-0 text-left" onClick={() => selectUser(user.id)}>
                    <p className="break-words font-semibold">{user.name}</p>
                    <p className="break-all text-xs text-muted-foreground">{user.email}</p>
                  </button>
                  <div className="shrink-0">
                    <StatusBadge status={user.status} />
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="break-all">{user.phone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Role</p>
                    <p>{user.role}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Is Hold</p>
                    <p className={user.isHold ? "text-red-500" : ""}>{user.isHold ? "Holded" : "No"}</p>
                  </div>
                </div>

                <div className="mt-3 flex justify-end gap-2 border-t pt-3">{renderActions(user)}</div>
              </div>
            ))}
          </div>

          {/* ================= Desktop / Tablet: table ================= */}
          <div className="hidden w-full overflow-x-auto md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Is Hold</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((user) => (
                  <TableRow key={user.id} className={selected?.id === user.id ? "bg-accent/45" : ""}>
                    <TableCell>
                      <button className="text-left" onClick={() => selectUser(user.id)}>
                        <p className="font-semibold">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </button>
                    </TableCell>
                    <TableCell>{user.phone}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell><StatusBadge status={user.status} /></TableCell>
                    <TableCell className={user.isHold ? "text-red-500" : ""}>{user.isHold ? "Holded" : "No"}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">{renderActions(user)}</div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ================= User Details: popup ================= */}
      {detailsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={closeDetails}
          role="dialog"
          aria-modal="true"
          aria-label="User details"
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border bg-background shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b bg-background px-5 py-4">
              <div className="min-w-0">
                <h3 className="text-lg font-semibold">User Details</h3>
                <p className="text-sm text-muted-foreground">
                  {detailsLoading ? "Loading latest user..." : "Contact information and order history"}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={closeDetails} aria-label="Close user details">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-5">
              {selected ? (
                <div className="space-y-5">
                  <div>
                    <h3 className="break-words text-xl font-bold sm:text-2xl">{selected.name}</h3>
                    <div className="mt-2"><StatusBadge status={selected.status} /></div>
                  </div>
                  <div className="space-y-3 text-sm">
                    <Detail icon={Mail} text={selected.email} />
                    <Detail icon={Phone} text={selected.phone} />
                    <Detail icon={MapPin} text={selected.address} />
                    <Detail icon={UserCheck} text={`Joined ${formatDate(selected.joined)}`} />
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="flex items-center gap-2">
                      <PackageCheck className="h-4 w-4 text-gray-900" />
                      <p className="font-semibold">Order history</p>
                      <span className="rounded-lg bg-primary px-3 py-1 text-sm font-semibold text-primary-foreground">
                        {userOrders.length}
                      </span>
                    </div>
                    <div className="mt-3 space-y-3">
                      {ordersLoading ? (
                        <p className="text-sm text-muted-foreground">Loading orders...</p>
                      ) : userOrders.length ? (
                        userOrders.map((order) => (
                          <div key={order.id} className="flex items-center justify-between gap-3 border-b pb-3 last:border-0 last:pb-0">
                            <div className="min-w-0">
                              <p className="break-all text-sm font-semibold">{order.tranId || order.id}</p>
                              <p className="text-xs text-muted-foreground">{formatDate(order.date)}</p>
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="text-sm font-bold">{formatCurrency(order.total)}</p>
                              <StatusBadge status={order.status} />
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No orders found.</p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-md border p-3">
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-gray-900" />
                      <p className="font-semibold">Wishlist</p>
                      <span className="rounded-lg bg-primary px-3 py-1 text-sm font-semibold text-primary-foreground">
                        {wishlist.length}
                      </span>
                    </div>
                    <div className="mt-3 space-y-3">
                      {wishlistLoading ? (
                        <p className="text-sm text-muted-foreground">Loading wishlist...</p>
                      ) : wishlist.length ? (
                        wishlist.map((item) => (
                          <div key={item.id} className="flex items-center justify-between gap-3 border-b pb-3 last:border-0 last:pb-0">
                            <div className="flex min-w-0 items-center gap-3">
                              {item.image ? (
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="h-10 w-10 shrink-0 rounded-md object-cover"
                                />
                              ) : null}
                              <div className="min-w-0">
                                <p className="break-words text-sm font-semibold">{item.name}</p>
                                {item.addedAt ? (
                                  <p className="text-xs text-muted-foreground">Added {formatDate(item.addedAt)}</p>
                                ) : null}
                              </div>
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="text-sm font-bold">{formatCurrency(item.price)}</p>
                              {item.hasDiscount ? (
                                <p className="text-xs text-muted-foreground line-through">
                                  {formatCurrency(item.originalPrice)}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No wishlist items found.</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Select a user to view details.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({ icon: Icon, text }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 break-words">{text}</span>
    </div>
  );
}
