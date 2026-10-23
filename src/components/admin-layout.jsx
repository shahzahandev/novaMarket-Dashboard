import {
  BarChart3, Bell, ChevronDown, ClipboardList, Headphones, Heart, Image as ImageIcon,
  LayoutDashboard, LogOut, Megaphone, Menu, MessageCircle, Package, Phone, Settings,
  ShoppingBag, ShoppingCart, SlidersHorizontal, Truck, Users, X, MessageSquare, Moon, Sun,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useApiConfig } from "@/context/ApiContext";
import { useStoreInfo } from "@/context/StoreInfoContext";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    id: "update-settings",
    label: "Update Settings",
    icon: SlidersHorizontal,
    children: [
      { id: "banner", label: "Home Banner", icon: ImageIcon },
      { id: "notice", label: "Notice Board", icon: Megaphone },
      { id: "deliverys", label: "Delivery charge", icon: Truck },
      { id: "whatsapp", label: "Whatsapp number", icon: Phone },
    ],
  },

  { id: "products", label: "Products", icon: Package },
  {
    id: "order-settings",
    label: "Order Settings",
    icon: ClipboardList,
    children: [
      { id: "orders", label: "Orders", icon: ShoppingBag },
      { id: "wishlist", label: "Wishlist", icon: Heart },
      { id: "cart", label: "Cart", icon: ShoppingCart },
    ],
  },
  { id: "users", label: "Users", icon: Users },
  { id: "message", label: "Message", icon: MessageCircle},
  { id: "reports", label: "Reports", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
];

const READ_NOTIFICATIONS_KEY = "novaAdminReadNotifications";

function readNotificationIds() {
  try {
    const stored = JSON.parse(localStorage.getItem(READ_NOTIFICATIONS_KEY) || "[]");
    return new Set(Array.isArray(stored) ? stored : []);
  } catch {
    return new Set();
  }
}

export function AdminLayout({ activePage, setActivePage, onLogout, isDarkMode, onToggleTheme, children }) {
  const { storeInfo } = useStoreInfo();
  const { API_BASE } = useApiConfig();

  const [open, setOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState([]);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [productsForNotifications, setProductsForNotifications] = useState([]);
  const [ordersForNotifications, setOrdersForNotifications] = useState([]);
  const [messagesForNotifications, setMessagesForNotifications] = useState([]);
  const [readNotifications, setReadNotifications] = useState(readNotificationIds);
  const storeName = storeInfo?.storeName || "Store";
  const storeEmail = storeInfo?.storeEmail || "";

  useEffect(() => {
    let active = true;

    const fetchNotifications = async () => {
      const results = await Promise.allSettled([
        axios.get(`${API_BASE}/product/allProduct`),
        axios.get(`${API_BASE}/order/allOrder`),
        axios.get(`${API_BASE}/message/allMessage`),
      ]);

      if (!active) return;

      const [productsResult, ordersResult, messagesResult] = results;
      if (productsResult.status === "fulfilled") {
        const data = productsResult.value.data;
        const list = data.allProduct || data.productData || data.data || [];
        if (Array.isArray(list)) setProductsForNotifications(list);
      }
      if (ordersResult.status === "fulfilled") {
        const data = ordersResult.value.data;
        const list = data.order || data.orders || [];
        if (Array.isArray(list)) setOrdersForNotifications(list);
      }
      if (messagesResult.status === "fulfilled") {
        const list = messagesResult.value.data.contactMessages || [];
        if (Array.isArray(list)) setMessagesForNotifications(list);
      }
    };

    fetchNotifications();
    const interval = window.setInterval(fetchNotifications, 30000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  const notifications = useMemo(() => {
    const lowStock = productsForNotifications
      .filter((product) => Number.isFinite(Number(product.stock)) && Number(product.stock) <= 8)
      .map((product) => {
        const id = product._id || product.id;
        const stock = Number(product.stock);
        const title = product.title || product.name || "Untitled product";
        return {
          id: `low-stock:${id}:${product.updatedAt || stock}`,
          type: "low-stock",
          page: "products",
          title: "Low stock",
          description: `${title} — ${stock} left`,
          Icon: Package,
        };
      })
      .filter((item) => !item.id.includes(":undefined:"));

    const pendingOrders = ordersForNotifications
      .filter((order) => order.status === "pending")
      .map((order) => {
        const id = order._id || order.id;
        const customer = order.shipping?.name;
        return {
          id: `pending-order:${id}`,
          type: "pending-order",
          page: "orders",
          title: "Pending order",
          description: `#${String(id).slice(-8).toUpperCase()}${customer ? ` — ${customer}` : ""}`,
          Icon: ShoppingBag,
        };
      })
      .filter((item) => !item.id.includes(":undefined"));

    const newMessages = messagesForNotifications
      .filter((message) => String(message.status || "New").toLowerCase() === "new")
      .map((message) => {
        const id = message._id || message.id;
        return {
          id: `contact-message:${id}`,
          type: "contact-message",
          page: "message",
          title: "New contact message",
          description: message.name || message.email || "Customer message",
          Icon: MessageSquare,
        };
      })
      .filter((item) => !item.id.includes(":undefined"));

    return [...newMessages, ...pendingOrders, ...lowStock];
  }, [productsForNotifications, ordersForNotifications, messagesForNotifications]);

  const unreadCount = notifications.filter((item) => !readNotifications.has(item.id)).length;

  const openNotifications = () => {
    if (!notificationPanelOpen) {
      const nextRead = new Set(readNotifications);
      notifications.forEach((item) => nextRead.add(item.id));
      setReadNotifications(nextRead);
      localStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify([...nextRead]));
    }
    setNotificationPanelOpen((current) => !current);
  };

  const selectNotification = (page) => {
    setActivePage(page);
    setNotificationPanelOpen(false);
  };

  const toggleGroup = (id) =>
    setOpenGroups((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id],
    );

  const selectPage = (id) => {
    setActivePage(id);
    setOpen(false);
  };

  const itemClass = (active) =>
    cn("flex h-10 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-medium transition",
      active
        ? "bg-primary text-primary-foreground shadow-sm"
        : "text-slate-700 hover:bg-accent hover:text-accent-foreground",
    );

  const nav = (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const { id, label, icon: Icon, children: subItems } = item;

        // Dropdown group
        if (subItems) {
          const childActive = subItems.some((c) => c.id === activePage);
          const isOpen = openGroups.includes(id) || childActive;

          return (
            <div key={id}>
              <button
                onClick={() => toggleGroup(id)}
                className={cn(
                  "flex h-10 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-medium transition",
                  childActive
                    ? "bg-accent text-accent-foreground"
                    : "text-slate-700 hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{label}</span>
                <ChevronDown
                  className={cn("h-4 w-4 shrink-0 transition-transform", isOpen && "rotate-180")}
                />
              </button>

              {isOpen && (
                <div className="ml-4 mt-1 space-y-1 border-l pl-3">
                  {subItems.map(({ id: subId, label: subLabel, icon: SubIcon }) => (
                    <button
                      key={subId}
                      onClick={() => selectPage(subId)}
                      className={itemClass(activePage === subId)}
                    >
                      <SubIcon className="h-4 w-4 shrink-0" />
                      {subLabel}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        }

        // Normal item
        return (
          <button key={id} onClick={() => selectPage(id)} className={itemClass(activePage === id)}>
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden h-screen w-72 flex-col overflow-hidden border-r bg-card px-4 py-5 lg:flex">
        <Brand />
        <div className="mt-8 min-h-0 flex-1 overflow-y-auto overscroll-contain pb-2">{nav}</div>
        <SidebarFooter onRequestLogout={() => setLogoutConfirmOpen(true)} />
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden" onClick={() => setOpen(false)} />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-screen w-72 flex-col overflow-hidden border-r bg-card px-4 py-5 transition-transform lg:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between">
          <Brand />
          <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close menu">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="mt-8 min-h-0 flex-1 overflow-y-auto overscroll-contain pb-2">{nav}</div>
        <SidebarFooter onRequestLogout={() => setLogoutConfirmOpen(true)} />
      </aside>

      <main className="lg:pl-72">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/90 px-4 backdrop-blur md:px-8">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold">{storeName} Admin</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={onToggleTheme}
              aria-label={`Switch to ${isDarkMode ? "light" : "dark"} mode`}
              title={`Switch to ${isDarkMode ? "light" : "dark"} mode`}
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <div className="relative">
              <Button
                variant="outline"
                size="icon"
                aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
                aria-expanded={notificationPanelOpen}
                aria-controls="admin-notifications"
                onClick={openNotifications}
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-sm bg-red-500 ring-2 ring-background" />
                )}
              </Button>

              {notificationPanelOpen && (
                <section
                  id="admin-notifications"
                  role="region"
                  aria-label="Notifications"
                  className="absolute right-0 top-full z-50 mt-2 max-h-[min(28rem,calc(100vh-6rem))] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto rounded-lg border bg-card p-3 shadow-xl"
                >
                  <div className="flex items-center justify-between border-b px-1 pb-3">
                    <h2 className="font-semibold">Notifications</h2>
                    <span className="text-xs text-muted-foreground">
                      {notifications.length} total
                    </span>
                  </div>

                  {notifications.length === 0 ? (
                    <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                      No notifications right now.
                    </p>
                  ) : (
                    <div className="mt-2 space-y-1">
                      {notifications.map(({ id, page, title, description, Icon }) => {
                        const unread = !readNotifications.has(id);
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => selectNotification(page)}
                            className={cn(
                              "flex w-full items-start gap-3 rounded-md p-3 text-left transition hover:bg-accent",
                              unread && "bg-accent/60",
                            )}
                          >
                            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                              <Icon className="h-4 w-4" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center justify-between gap-2">
                                <span className="text-sm font-medium">{title}</span>
                                {unread && <span className="h-2 w-2 shrink-0 rounded-sm bg-red-500" />}
                              </span>
                              <span className="mt-1 block truncate text-xs text-muted-foreground">
                                {description}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </section>
              )}
            </div>
            <div className="hidden items-center gap-3 rounded-md border bg-card px-3 py-2 md:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
                {storeName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold">Store Admin</p>
                <p className="text-xs text-muted-foreground">{storeEmail}</p>
              </div>
            </div>
          </div>
        </header>
        <div className="px-4 py-6 md:px-8">{children}</div>
      </main>

      {logoutConfirmOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 p-4"
          onClick={() => setLogoutConfirmOpen(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-confirm-title"
            className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="logout-confirm-title" className="text-lg font-semibold">
              Are you sure you want to log out?
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              You will need to sign in again to access the dashboard.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setLogoutConfirmOpen(false)}>
                No
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setLogoutConfirmOpen(false);
                  onLogout();
                }}
              >
                Yes, logout
              </Button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function Brand() {
  // Context theke direct nicche, tai props pass korte hobe na
  const { storeInfo } = useStoreInfo();

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-950 text-white">
        <div className="font-bold">DB</div>
      </div>
      <div>
        <p className="text-lg font-bold">{storeInfo?.storeName || "Store"}</p>
        <p className="text-xs text-muted-foreground">Admin control panel</p>
      </div>
    </div>
  );
}

function SidebarFooter({ onRequestLogout }) {
  return (
    <div className="mt-4 shrink-0 border-t pt-3">
      <Button
        variant="ghost"
        onClick={onRequestLogout}
        className="w-full justify-start text-rose-600"
      >
        <LogOut className="h-4 w-4" />
        Logout
      </Button>
    </div>
  );
}
