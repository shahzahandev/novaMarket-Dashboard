import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Loader2, Save, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const API_ORIGIN = "https://nova-market-backend-2.onrender.com";
const SETTINGS_URL = `${API_ORIGIN}/api/v1/delivery/settings`;

// Admin token tomar dashboard e jekhane rakho, shekhan theke nao
const getAuthHeaders = () => {
  const token = localStorage.getItem("adminToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ---------- Bangladesh time (UTC+6) helpers ----------
// datetime-local input timezone chhara value dey, tai shobshomoy +06:00 dhore nichhi.
// Eta browser er timezone er upor depend kore na.
const BD_OFFSET_MS = 6 * 60 * 60 * 1000;

const isoToInput = (iso) =>
  iso
    ? new Date(new Date(iso).getTime() + BD_OFFSET_MS).toISOString().slice(0, 16)
    : "";

const inputToIso = (value) =>
  value ? new Date(`${value}:00+06:00`).toISOString() : null;

const formatBD = (value) =>
  value ? value.replace("T", ", ") + " (BD time)" : "";

const settingsToForm = (s) => ({
  insideDhakaCharge: String(s.insideDhakaCharge ?? 0),
  outsideDhakaCharge: String(s.outsideDhakaCharge ?? 0),
  freeDeliveryEnabled: Boolean(s.freeDeliveryEnabled),
  freeDeliveryThreshold: String(s.freeDeliveryThreshold ?? 0),
  freeAllEnabled: Boolean(s.freeAllEnabled),
  freeAllStartDate: isoToInput(s.freeAllStartDate),
  freeAllEndDate: isoToInput(s.freeAllEndDate),
});

const isValidAmount = (v) => v !== "" && Number.isFinite(Number(v)) && Number(v) >= 0;

export function DeliverySettings() {
  const [form, setForm] = useState(null);
  const [initial, setInitial] = useState("");
  const [freeAllActive, setFreeAllActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null); // { type: "success" | "error", text }
  const [errors, setErrors] = useState({});
  const [previewTotal, setPreviewTotal] = useState("1500");

  // ---------- Load ----------
  const load = useCallback(async () => {
    try {
      setLoadError("");
      const res = await axios.get(SETTINGS_URL);
      const s = res.data.settings;
      const next = settingsToForm(s);
      setForm(next);
      setInitial(JSON.stringify(next));
      setFreeAllActive(Boolean(s.freeAllActive));
    } catch (error) {
      console.error("Delivery settings load error:", error);
      setLoadError(error.response?.data?.message || "Could not load delivery settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const isDirty = useMemo(
    () => form !== null && JSON.stringify(form) !== initial,
    [form, initial]
  );

  const setField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
    setMessage(null);
  };

  // ---------- Validation ----------
  const validate = () => {
    const next = {};

    if (!isValidAmount(form.insideDhakaCharge))
      next.insideDhakaCharge = "Enter a valid amount (0 or more).";
    if (!isValidAmount(form.outsideDhakaCharge))
      next.outsideDhakaCharge = "Enter a valid amount (0 or more).";
    if (!isValidAmount(form.freeDeliveryThreshold))
      next.freeDeliveryThreshold = "Enter a valid amount (0 or more).";

    if (
      form.freeAllStartDate &&
      form.freeAllEndDate &&
      form.freeAllStartDate >= form.freeAllEndDate
    ) {
      next.freeAllEndDate = "End must be after start.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  // ---------- Save ----------
  const handleSave = async () => {
    setMessage(null);
    if (!validate()) return;

    setSaving(true);
    try {
      await axios.put(
        SETTINGS_URL,
        {
          insideDhakaCharge: Number(form.insideDhakaCharge),
          outsideDhakaCharge: Number(form.outsideDhakaCharge),
          freeDeliveryEnabled: form.freeDeliveryEnabled,
          freeDeliveryThreshold: Number(form.freeDeliveryThreshold),
          freeAllEnabled: form.freeAllEnabled,
          freeAllStartDate: inputToIso(form.freeAllStartDate),
          freeAllEndDate: inputToIso(form.freeAllEndDate),
        },
        { headers: getAuthHeaders() }
      );

      await load(); // server theke fresh data (freeAllActive shoho)
      setMessage({ type: "success", text: "Delivery settings saved." });
    } catch (error) {
      console.error("Delivery settings save error:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Could not save settings.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!initial) return;
    setForm(JSON.parse(initial));
    setErrors({});
    setMessage(null);
  };

  // ---------- Preview (unsaved value diye) ----------
  const preview = useMemo(() => {
    if (!form) return null;

    const total = Number(previewTotal) || 0;
    const now = new Date();
    const start = form.freeAllStartDate ? new Date(inputToIso(form.freeAllStartDate)) : null;
    const end = form.freeAllEndDate ? new Date(inputToIso(form.freeAllEndDate)) : null;

    const promo =
      form.freeAllEnabled && (!start || now >= start) && (!end || now <= end);
    const byThreshold =
      form.freeDeliveryEnabled &&
      isValidAmount(form.freeDeliveryThreshold) &&
      total >= Number(form.freeDeliveryThreshold);

    const free = promo || byThreshold;
    const reason = promo ? "Free delivery period" : byThreshold ? "Cart total reached" : null;

    return {
      free,
      reason,
      inside: free ? 0 : Number(form.insideDhakaCharge) || 0,
      outside: free ? 0 : Number(form.outsideDhakaCharge) || 0,
    };
  }, [form, previewTotal]);

  // ---------- Render ----------
  if (loading) {
    return (
      <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading delivery settings...
      </div>
    );
  }

  if (loadError || !form) {
    return (
      <div className="space-y-3 p-6">
        <p className="text-sm text-destructive">{loadError || "Something went wrong."}</p>
        <Button variant="outline" onClick={() => { setLoading(true); load(); }}>
          Try again
        </Button>
      </div>
    );
  }

  const noDates = !form.freeAllStartDate && !form.freeAllEndDate;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Truck className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Delivery settings</h1>
            <p className="text-sm text-muted-foreground">
              Normal charge, Cart total charge, Free charge for limit date or infinite 
            </p>
          </div>
        </div>

        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
            freeAllActive
              ? "bg-emerald-100 text-emerald-700"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {freeAllActive ? "Free delivery is ON now" : "Normal charges"}
        </span>
      </div>

      {/* 1. Charges */}
      <Card>
        <CardHeader>
          <CardTitle><span>1.</span> Delivery charge</CardTitle>
          <CardDescription>Delivery charge for fix area </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="inside">Inside Dhaka (৳)</Label>
            <Input
              id="inside"
              type="number"
              min="0"
              value={form.insideDhakaCharge}
              onChange={(e) => setField("insideDhakaCharge", e.target.value)}
            />
            {errors.insideDhakaCharge && (
              <p className="text-xs text-destructive">{errors.insideDhakaCharge}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="outside">Outside Dhaka (৳)</Label>
            <Input
              id="outside"
              type="number"
              min="0"
              value={form.outsideDhakaCharge}
              onChange={(e) => setField("outsideDhakaCharge", e.target.value)}
            />
            {errors.outsideDhakaCharge && (
              <p className="text-xs text-destructive">{errors.outsideDhakaCharge}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 2. Free by cart total */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1.5">
              <CardTitle><span>2.</span> Free delivery by cart total</CardTitle>
              <CardDescription>
               Free delivery if cart amount qual or up.
              </CardDescription>
            </div>
            <Switch
              checked={form.freeDeliveryEnabled}
              onCheckedChange={(v) => setField("freeDeliveryEnabled", v)}
              aria-label="Enable free delivery by cart total"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="threshold">Minimum cart total (৳)</Label>
          <Input
            id="threshold"
            type="number"
            min="0"
            value={form.freeDeliveryThreshold}
            disabled={!form.freeDeliveryEnabled}
            onChange={(e) => setField("freeDeliveryThreshold", e.target.value)}
            className="max-w-xs"
          />
          {errors.freeDeliveryThreshold && (
            <p className="text-xs text-destructive">{errors.freeDeliveryThreshold}</p>
          )}
        </CardContent>
      </Card>

      {/* 3. Free for all products (period) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1.5">
              <CardTitle><span>3.</span> Free delivery for all products</CardTitle>
              <CardDescription>
                Free delivery for limit date or infinite time
              </CardDescription>
            </div>
            <Switch
              checked={form.freeAllEnabled}
              onCheckedChange={(v) => setField("freeAllEnabled", v)}
              aria-label="Enable free delivery for all products"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="start">Start (Bangladesh time)</Label>
              <Input
                id="start"
                type="datetime-local"
                value={form.freeAllStartDate}
                disabled={!form.freeAllEnabled}
                onChange={(e) => setField("freeAllStartDate", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end">End (Bangladesh time)</Label>
              <Input
                id="end"
                type="datetime-local"
                value={form.freeAllEndDate}
                disabled={!form.freeAllEnabled}
                onChange={(e) => setField("freeAllEndDate", e.target.value)}
              />
              {errors.freeAllEndDate && (
                <p className="text-xs text-destructive">{errors.freeAllEndDate}</p>
              )}
            </div>
          </div>

          {form.freeAllEnabled && (form.freeAllStartDate || form.freeAllEndDate) && (
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                {form.freeAllStartDate ? `From ${formatBD(form.freeAllStartDate)}` : "From now"}
                {" → "}
                {form.freeAllEndDate ? `until ${formatBD(form.freeAllEndDate)}` : "no end date"}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setField("freeAllStartDate", "");
                  setField("freeAllEndDate", "");
                }}
              >
                Clear dates
              </Button>
            </div>
          )}

          {form.freeAllEnabled && noDates && (
            <p className=" rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Both start and end dates are empty. When enabled, free delivery will remain active at all times until you turn off the switch.

            </p>
          )}
        </CardContent>
      </Card>

      {/* 4. Preview */}
      <Card>
        <CardHeader>
          <CardTitle><span>4.</span> Preview</CardTitle>
          <CardDescription>
            Preview what delivery charge customers will see before saving (using the current unsaved values).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="preview">Cart total (৳)</Label>
            <Input
              id="preview"
              type="number"
              min="0"
              value={previewTotal}
              onChange={(e) => setPreviewTotal(e.target.value)}
              className="max-w-xs"
            />
          </div>

          {preview && (
            <div className="grid gap-3 sm:grid-cols-2">
              <PreviewBox label="Inside Dhaka" value={preview.inside} free={preview.free} />
              <PreviewBox label="Outside Dhaka" value={preview.outside} free={preview.free} />
              {preview.reason && (
                <p className="text-xs text-emerald-700 sm:col-span-2">
                  Free because: {preview.reason}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      {message && (
        <p
          className={`rounded-md border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </p>
      )}

      <div className="flex items-center justify-end gap-3">
        <Button variant="outline" onClick={handleReset} disabled={!isDirty || saving}>
          Reset
        </Button>
        <Button onClick={handleSave} disabled={!isDirty || saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function PreviewBox({ label, value, free }) {
  return (
    <div className="flex items-center justify-between rounded-lg border px-4 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`font-mono text-sm font-semibold ${free ? "text-emerald-600" : ""}`}>
        {free ? "Free" : `৳${value}`}
      </span>
    </div>
  );
}