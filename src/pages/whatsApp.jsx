import { CalendarClock, MessageCircle, RefreshCw, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";

const API_BASE = "https://nova-market-backend-2.onrender.com/api/v1";
const CREATE_WHATSAPP_URL = `${API_BASE}/whatsapp/creatWhatsapp`;
const GET_WHATSAPP_URL = `${API_BASE}/whatsapp/getWhatsapp`;
const UPDATE_WHATSAPP_URL = `${API_BASE}/whatsapp/updateWhatsapp`;

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function WhatsApp() {
  const [setting, setSetting] = useState(null); // null = ekhono create kora hoyni
  const [phone, setPhone] = useState("");
  const [isActive, setIsActive] = useState("Active");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const applySetting = (data) => {
    setSetting(data);
    setPhone(data?.phone || "");
    setIsActive(data?.isActive === false ? "Inactive" : "Active");
  };

  const fetchWhatsApp = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(GET_WHATSAPP_URL);

      // 404 mane ekhono kono number create kora hoyni, eta error na
      if (response.status === 404) {
        applySetting(null);
        return;
      }
      if (!response.ok) throw new Error("Failed to load WhatsApp setting");

      const result = await response.json();
      applySetting(result.data || null);
    } catch (err) {
      setError("WhatsApp setting load kora jayni. Backend endpoint/CORS check korte hobe.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWhatsApp();
  }, []);

  const handleSave = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const cleanPhone = phone.trim();
    if (!cleanPhone) {
      setError("WhatsApp number dite hobe.");
      return;
    }
    if (!/^\+?[0-9\s-]{8,20}$/.test(cleanPhone)) {
      setError("Valid number din (country code shoho, jemon 8801XXXXXXXXX).");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(setting ? UPDATE_WHATSAPP_URL : CREATE_WHATSAPP_URL, {
        method: setting ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanPhone, isActive: isActive === "Active" }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || "Failed to save WhatsApp setting");

      applySetting(result.data || setting);
      setSuccess(result.message || (setting ? "WhatsApp setting updated." : "WhatsApp number created."));
    } catch (err) {
      setError(err.message || "WhatsApp setting save hoyni.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Inactive number list:
  // - purano number gulo (backend e `history` thakle)
  // - ar ekhon-er number jodi inactive hoy
  const inactiveNumbers = useMemo(() => {
    const rows = (setting?.history || []).map((item, index) => ({
      id: item._id || `history-${index}`,
      phone: item.phone,
      createdAt: item.createdAt,
      inactiveAt: item.inactiveAt,
      isCurrent: false,
    }));

    if (setting && setting.isActive === false) {
      rows.push({
        id: "current",
        phone: setting.phone,
        createdAt: setting.phoneSetAt || setting.createdAt,
        inactiveAt: setting.inactiveAt || setting.updatedAt,
        isCurrent: true,
      });
    }

    return rows.sort((a, b) => new Date(b.inactiveAt || 0) - new Date(a.inactiveAt || 0));
  }, [setting]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-normal sm:text-3xl">WhatsApp</h2>
          </div>
          <p className="mt-2 text-muted-foreground">
            Customer support WhatsApp number, status and inactive number history.
          </p>
        </div>
        <Button variant="outline" onClick={fetchWhatsApp} disabled={loading}>
          <RefreshCw className="h-4 w-4" />
          {loading ? "Loading..." : "Reload API"}
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {success}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-1">
        {/* ================= Create / Update form ================= */}
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>{setting ? "Update WhatsApp Number" : "Create WhatsApp Number"}</CardTitle>
            <CardDescription>
              {setting
                ? "Ei number ta storefront e WhatsApp contact hishebe use hoy."
                : "Ekhono kono WhatsApp number add kora hoyni."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-5">
              {setting && (
                <div className="rounded-md border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <MessageCircle className="h-4 w-4 shrink-0 text-gray-900" />
                      <p className="break-all font-semibold">{setting.phone}</p>
                    </div>
                    <StatusBadge status={setting.isActive === false ? "Inactive" : "Active"} />
                  </div>
                  <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <CalendarClock className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>Created: {formatDateTime(setting.phoneSetAt || setting.createdAt)}</span>
                    </div>
                    {setting.isActive === false && (
                      <div className="flex items-start gap-2">
                        <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                        <span className="text-red-500">
                          Inactive since: {formatDateTime(setting.inactiveAt || setting.updatedAt)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="whatsapp-phone" className="text-sm font-medium">
                  WhatsApp number
                </label>
                <Input
                  id="whatsapp-phone"
                  placeholder="8801XXXXXXXXX"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                />
                <p className="text-xs text-muted-foreground">Country code shoho number din, jemon 8801XXXXXXXXX.</p>
              </div>

              <div className="space-y-2">
                <label htmlFor="whatsapp-status" className="text-sm font-medium">
                  Status
                </label>
                <Select id="whatsapp-status" value={isActive} onChange={(event) => setIsActive(event.target.value)}>
                  <option>Active</option>
                  <option>Inactive</option>
                </Select>
              </div>

              <Button type="submit" disabled={saving || loading} className="w-full sm:w-auto">
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : setting ? "Update" : "Create"}
              </Button>
            </form>
          </CardContent>
        </Card>

    
      </div>
    </div>
  );
}
