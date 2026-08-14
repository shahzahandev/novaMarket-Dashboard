import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/admin-layout";
import { activitySeed, ordersSeed, productsSeed, salesSeed, usersSeed } from "@/data/mock-data";
import { DashboardPage } from "@/pages/dashboard";
import { OrdersPage } from "@/pages/orders";
import { ProductsPage } from "@/pages/products";
import { ReportsPage } from "@/pages/reports";
import { SettingsPage } from "@/pages/settings";
import { UsersPage } from "@/pages/users";

const pageTitles = {
  dashboard: "Dashboard",
  products: "Products",
  users: "Users",
  orders: "Orders",
  reports: "Reports",
  settings: "Settings",
};

export default function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [products, setProducts] = useState(productsSeed);
  const [users, setUsers] = useState(usersSeed);
  const [orders, setOrders] = useState(ordersSeed);
  const [chartData, setChartData] = useState(salesSeed);
  const [activity, setActivity] = useState(activitySeed);

  useEffect(() => {
    document.title = `E-Earbuds | ${pageTitles[activePage]}`;
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
    if (activePage === "users") {
      return <UsersPage users={users} setUsers={setUsers} orders={orders} />;
    }
    if (activePage === "orders") {
      return <OrdersPage orders={orders} setOrders={setOrders} />;
    }
    if (activePage === "reports") {
      return <ReportsPage products={products} orders={orders} />;
    }
    if (activePage === "settings") {
      return <SettingsPage />;
    }
    return (
      <DashboardPage
        products={products}
        users={users}
        orders={orders}
        chartData={chartData}
        activity={activity}
      />
    );
  }, [activePage, products, users, orders, chartData, activity]);

  return (
    <AdminLayout activePage={activePage} setActivePage={setActivePage}>
      {page}
    </AdminLayout>
  );
}
