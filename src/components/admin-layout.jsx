import {
  BarChart3,
  Bell,
  Headphones,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  ShoppingBag,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "products", label: "Products", icon: Package },
  { id: "users", label: "Users", icon: Users },
  { id: "orders", label: "Orders", icon: ShoppingBag },
  { id: "reports", label: "Reports", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
];

export function AdminLayout({ activePage, setActivePage, children }) {
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="space-y-1">
      {navItems.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => {
            setActivePage(id);
            setOpen(false);
          }}
          className={cn(
            "flex h-10 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-medium transition",
            activePage === id
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-slate-700 hover:bg-accent hover:text-accent-foreground",
          )}
        >
          <Icon className="h-4 w-4 shrink-0" />
          {label}
        </button>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r bg-card px-4 py-5 lg:block">
        <Brand />
        <div className="mt-8">{nav}</div>
        <SidebarFooter />
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden" onClick={() => setOpen(false)} />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 border-r bg-card px-4 py-5 transition-transform lg:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between">
          <Brand />
          <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close menu">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="mt-8">{nav}</div>
        <SidebarFooter />
      </aside>

      <main className="lg:pl-72">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/90 px-4 backdrop-blur md:px-8">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold">Nova-Market Admin</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" aria-label="Notifications">
              <Bell className="h-4 w-4" />
            </Button>
            <div className="hidden items-center gap-3 rounded-md border bg-card px-3 py-2 md:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
                E
              </div>
              <div>
                <p className="text-sm font-semibold">Store Admin</p>
                <p className="text-xs text-muted-foreground">admin@nmova-market.com</p>
              </div>
            </div>
          </div>
        </header>
        <div className="px-4 py-6 md:px-8">{children}</div>
      </main>
    </div>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-950 text-white">
        <Headphones className="h-5 w-5" />
      </div>
      <div>
        <p className="text-lg font-bold">E-Earbuds</p>
        <p className="text-xs text-muted-foreground">Admin control panel</p>
      </div>
    </div>
  );
}

function SidebarFooter() {
  return (
    <div className="absolute bottom-5 left-4 right-4">
      <div className="mb-3 rounded-lg border bg-muted/40 p-3 text-sm">
        <p className="font-semibold">Today target</p>
        <div className="mt-3 h-2 rounded-full bg-slate-200">
          <div className="h-2 w-[72%] rounded-full bg-primary" />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">72% completed</p>
      </div>
      <Button variant="ghost" className="w-full justify-start text-rose-600">
        <LogOut className="h-4 w-4" />
        Logout
      </Button>
    </div>
  );
}
