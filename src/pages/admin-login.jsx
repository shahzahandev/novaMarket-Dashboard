import { useState } from "react";
import axios from "axios";
import { Eye, EyeOff, LockKeyhole, ShieldCheck } from "lucide-react";
import { useStoreInfo } from "@/context/StoreInfoContext";
import { useApiConfig } from "@/context/ApiContext";

export function AdminLogin({ onLogin, notice }) {
  const { API_BASE } = useApiConfig();
  const { storeInfo } = useStoreInfo();
  const storeName = storeInfo?.storeName?.trim() || "Nova Market";
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!formData.email || !formData.password) {
      setError("Email and password are required.");
      return;
    }

    try {
      setLoading(true);

      const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
        ...formData,
        loginType: "admin",
      });
      const token = loginResponse.data.token;

      if (!token) {
        throw new Error("Admin token was not received.");
      }

      const verifyResponse = await axios.get(`${API_BASE}/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!verifyResponse.data.success) {
        setError("Admin access verification failed.");
        return;
      }

      sessionStorage.setItem("adminToken", token);
      onLogin();
    } catch (err) {
      console.error("Admin Login Error:", err);
      setError(
        err.response?.data?.message || err.message || "Login failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-accent to-transparent" />
      <section className="relative w-full max-w-md rounded-xl border bg-card p-7 shadow-lg shadow-slate-200/60 sm:p-9">
        <div className="mb-7 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              {storeName}
            </p>
            <p className="text-sm text-muted-foreground">Admin control panel</p>
          </div>
        </div>

        <div className="mb-7">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Sign in to your {storeName} dashboard
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your admin credentials to continue.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {notice && (
            <p role="status" className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {notice}
            </p>
          )}
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium">
              Email address
            </label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              autoComplete="username"
              required
              placeholder="admin@example.com"
              className="h-11 w-full rounded-md border bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
                required
                placeholder="Enter your password"
                className="h-11 w-full rounded-md border bg-background px-3 pr-11 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-md text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p role="alert" className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-center gap-2 border-t pt-5 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Secure admin access
        </div>
      </section>
    </main>
  );
}
