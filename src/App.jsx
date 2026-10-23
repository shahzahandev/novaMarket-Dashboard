import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import axios from "axios";
import { AdminLayout } from "@/components/admin-layout";
import { activitySeed, ordersSeed, productsSeed, salesSeed, usersSeed } from "@/data/mock-data";
import { DashboardPage } from "@/pages/dashboard";
import { OrdersPage } from "@/pages/orders";
import { ProductsPage } from "@/pages/products";
import { ReportsPage } from "@/pages/reports";
import { StoreInfo } from "./pages/settings";
import { UsersPage } from "@/pages/users";
import { BannerPage } from "@/pages/banner";
import { Wishlist } from "./pages/wishlist";
import { DeliverySettings } from "@/pages/DeliverySettings";
import { WhatsApp } from "@/pages/whatsApp";
import NoticeSettings from "@/pages/NoticeSettings";
import { CartPage } from "@/pages/cart";
import ContactMessages from "./pages/ContactMessages";
import { AdminLogin } from "@/pages/admin-login";
import { handleAdminUnauthorized } from "@/context/ApiContext";

export const API_ORIGIN = "https://nova-market-backend-2.onrender.com";
export const API_BASE = `${API_ORIGIN}/api/v1`;

const pageTitles = {
  dashboard: "Dashboard",
  banner: "Banner",
  deliverys: "Deliverys",
  notice: "notice",
  whatsapp: "WhatsApp",
  products: "Products",
  users: "Users",
  wishlist: "Wishlist",
  cart: "Cart",
  orders: "Orders",
  message: "Message",
  reports: "Reports",
  settings: "Settings",
};

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      return localStorage.getItem("novaAdminTheme") === "dark";
    } catch {
      return false;
    }
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() =>
    Boolean(sessionStorage.getItem("adminToken")),
  );
  const [adminEmail, setAdminEmail] = useState(() =>
    sessionStorage.getItem("adminEmail") || "",
  );
  const [activePage, setActivePage] = useState("dashboard");
  const [products, setProducts] = useState(productsSeed);
  const [users, setUsers] = useState(usersSeed);
  const [orders, setOrders] = useState(ordersSeed);
  const [chartData, setChartData] = useState(salesSeed);
  const [activity, setActivity] = useState(activitySeed);
  const [authMessage, setAuthMessage] = useState("");

  useLayoutEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
    try {
      localStorage.setItem("novaAdminTheme", isDarkMode ? "dark" : "light");
    } catch {
      // Keep the current theme for this session when storage is unavailable.
    }
  }, [isDarkMode]);

  useLayoutEffect(() => {
    const handleSessionExpired = () => {
      setAuthMessage("Your session has expired. Please sign in again.");
      setAdminEmail("");
      setIsAuthenticated(false);
    };

    const requestInterceptor = axios.interceptors.request.use((config) => {
      const token = sessionStorage.getItem("adminToken");
      if (token && String(config.url || "").startsWith(API_BASE)) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 && sessionStorage.getItem("adminToken")) {
          handleAdminUnauthorized();
        }
        return Promise.reject(error);
      },
    );

    window.addEventListener("admin-session-expired", handleSessionExpired);
    return () => {
      window.removeEventListener("admin-session-expired", handleSessionExpired);
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("adminToken");
    sessionStorage.removeItem("adminEmail");
    setAdminEmail("");
    setAuthMessage("");
    setIsAuthenticated(false);
  };

  useEffect(() => {
    document.title = `Nova Market ${pageTitles[activePage]}`;
  }, [activePage]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setChartData((current) => {
        const last = current[current.length - 1];
        const nextSales = Math.max(12000, last.sales + Math.floor(Math.random() * 7000 - 2100));
        const nextOrders = Math.max(1, last.orders + Math.floor(Math.random() * 3));

        return [
          ...current.slice(1, 7),
          {
            time: new Date().toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            sales: nextSales,
            orders: nextOrders,
          },
        ];
      });

      setActivity((current) => [
        `Live sales pulse updated at ${new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })}`,
        ...current.slice(0, 3),
      ]);
    }, 4500);

    return () => window.clearInterval(interval);
  }, []);

  const page = useMemo(() => {
    if (activePage === "products") {
      return <ProductsPage products={products} setProducts={setProducts} />;
    }
    if (activePage === "banner") {
      return <BannerPage />;
    }
    if (activePage === "deliverys") {
      return <DeliverySettings />;
    }
    if (activePage === "notice") {
      return <NoticeSettings />;
    }
    if (activePage === "whatsapp") {
      return <WhatsApp />;
    }
    if (activePage === "users") {
      return <UsersPage users={users} setUsers={setUsers} orders={orders} />;
    }
    if (activePage === "wishlist") {
      return <Wishlist />;
    }
    if (activePage === "cart") {
      return <CartPage />;
    }
    if (activePage === "orders") {
      return <OrdersPage orders={orders} setOrders={setOrders} />;
    }
    if (activePage === "reports") {
      return <ReportsPage products={products} orders={orders} />;
    }
    if (activePage === "settings") {
      return <StoreInfo />;
    }
   if (activePage === "message") {
      return <ContactMessages />;
    }
    return <DashboardPage />;
  }, [activePage, products, users, orders, chartData, activity]);

  return isAuthenticated ? (
    <AdminLayout
      activePage={activePage}
      setActivePage={setActivePage}
      onLogout={handleLogout}
      isDarkMode={isDarkMode}
      onToggleTheme={() => setIsDarkMode((current) => !current)}
      adminEmail={adminEmail}
    >
      {page}
    </AdminLayout>
  ) : (
    <AdminLogin
      notice={authMessage}
      onLogin={(email) => {
        const normalizedEmail = email.trim();
        sessionStorage.setItem("adminEmail", normalizedEmail);
        setAdminEmail(normalizedEmail);
        setAuthMessage("");
        setIsAuthenticated(true);
      }}
    />
  );
}
