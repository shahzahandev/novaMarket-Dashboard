
import { useEffect, useMemo, useState } from "react";
import {
  Mail,
  MapPin,
  Phone,
  RotateCcw,
  Save,
  Store,
  FileText,
} from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
import { useStoreInfo } from "@/context/StoreInfoContext";
import { API_BASE } from "@/lib/api";

const CREATE_URL = `${API_BASE}/store/createStoreInfo`;
const UPDATE_URL = `${API_BASE}/store/udateStoreInfo`;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EMPTY_FORM = {
  storeName: "",
  storeEmail: "",
  storeAddress: "",
  storePhone: ["", ""],
  returnPolicy: "",
};

const buildForm = (storeInfo) => ({
  storeName: storeInfo?.storeName ?? "",
  storeEmail: storeInfo?.storeEmail ?? "",
  storeAddress: storeInfo?.storeAddress ?? "",
  storePhone: [
    storeInfo?.storePhone?.[0] ?? "",
    storeInfo?.storePhone?.[1] ?? "",
  ],
  returnPolicy: storeInfo?.returnPolicy ?? "",
});

const validateForm = (form) => {
  if (!form.storeName.trim()) {
    return "Store name is required.";
  }

  if (!form.storeEmail.trim()) {
    return "Store email is required.";
  }

  if (!EMAIL_REGEX.test(form.storeEmail.trim())) {
    return "Please provide a valid email address.";
  }

  if (!form.storeAddress.trim()) {
    return "Store address is required.";
  }

  const phones = form.storePhone
    .map((phone) => phone.trim())
    .filter(Boolean);

  if (phones.length < 1) {
    return "At least one phone number is required.";
  }

  if (phones.length > 2) {
    return "You can provide a maximum of two phone numbers.";
  }

  return "";
};

export function StoreInfo() {
  const {
    storeInfo,
    setStoreInfo,
    loading,
    error: loadError,
    refetchStoreInfo,
  } = useStoreInfo();

  const exists = Boolean(storeInfo);

  const [form, setForm] = useState({ ...EMPTY_FORM, storePhone: ["", ""] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setForm(buildForm(storeInfo));
  }, [storeInfo]);

  const isDirty = useMemo(() => {
    const original = buildForm(storeInfo);

    const current = {
      ...form,
      storeName: form.storeName.trim(),
      storeEmail: form.storeEmail.trim(),
      storeAddress: form.storeAddress.trim(),
      storePhone: form.storePhone.map((phone) => phone.trim()),
      returnPolicy: form.returnPolicy.trim(),
    };

    const normalizedOriginal = {
      ...original,
      storeName: original.storeName.trim(),
      storeEmail: original.storeEmail.trim(),
      storeAddress: original.storeAddress.trim(),
      storePhone: original.storePhone.map((phone) => phone.trim()),
      returnPolicy: original.returnPolicy.trim(),
    };

    return (
      JSON.stringify(current) !== JSON.stringify(normalizedOriginal)
    );
  }, [form, storeInfo]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setError("");
    setSuccess("");

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePhoneChange = (index, value) => {
    setError("");
    setSuccess("");

    setForm((prev) => {
      const phones = [...prev.storePhone];
      phones[index] = value;

      return {
        ...prev,
        storePhone: phones,
      };
    });
  };

  const handleReset = () => {
    setError("");
    setSuccess("");
    setForm(buildForm(storeInfo));
  };

  const handleReload = async () => {
    setError("");
    setSuccess("");
    await refetchStoreInfo();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const validationError = validateForm(form);

    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = {
      storeName: form.storeName.trim(),
      storeEmail: form.storeEmail.trim().toLowerCase(),
      storeAddress: form.storeAddress.trim(),
      storePhone: form.storePhone
        .map((phone) => phone.trim())
        .filter(Boolean),
      returnPolicy: form.returnPolicy.trim(),
    };

    setSaving(true);

    try {
      const response = await fetch(exists ? UPDATE_URL : CREATE_URL, {
        method: exists ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      let data = null;

      try {
        data = await response.json();
      } catch {
        // Response-e JSON na thakle data null thakbe.
      }

      if (exists && response.status === 404) {
        setStoreInfo(null);

        throw new Error(
          "Store information was not found. Please create it again."
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.message || "Failed to save store information."
        );
      }

      if (!data?.storeInfo) {
        throw new Error(
          "Store information was saved, but the response data is missing."
        );
      }

      setStoreInfo(data.storeInfo);
      setSuccess(
        data.message || "Store information saved successfully."
      );
    } catch (err) {
      console.error("Store info save error:", err);
      setError(err.message || "Failed to save store information.");
    } finally {
      setSaving(false);
    }
  };

  const shownError = error || loadError;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-3xl font-bold tracking-normal">
              Store Information
            </h2>

            <span
              className={`rounded-lg px-3 py-1 text-sm font-semibold ${
                exists
                  ? "bg-primary text-primary-foreground"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {exists ? "Saved" : "Not created"}
            </span>
          </div>

          <p className="mt-2 text-muted-foreground">
            Manage your store name, contact details and return policy.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={handleReload}
          disabled={loading || saving}
        >
          {loading ? "Loading..." : "Reload"}
        </Button>
      </div>

      {/* Error */}
      {shownError && (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {shownError}
        </div>
      )}

      {/* Success */}
      {success && (
        <div
          role="status"
          className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
        >
          {success}
        </div>
      )}

      {loading && !storeInfo ? (
        <Card>
          <CardContent>
            <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
              Loading store information...
            </div>
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Basic Information
              </CardTitle>

              <CardDescription>
                {exists
                  ? "Update your existing store information."
                  : "Fill in the details to create your store information."}
              </CardDescription>
            </CardHeader>

            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="storeName">
                  Store Name <span className="text-red-500">*</span>
                </Label>

                <Input
                  id="storeName"
                  name="storeName"
                  value={form.storeName}
                  onChange={handleChange}
                  placeholder="Nova Market"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="storeEmail"
                  className="flex items-center gap-1"
                >
                  <Mail className="h-4 w-4" />
                  Store Email <span className="text-red-500">*</span>
                </Label>

                <Input
                  id="storeEmail"
                  name="storeEmail"
                  type="email"
                  value={form.storeEmail}
                  onChange={handleChange}
                  placeholder="support@novamarket.com"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Contact Details
              </CardTitle>

              <CardDescription>
                Provide your store address and one or two phone numbers.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="storeAddress">
                  Store Address <span className="text-red-500">*</span>
                </Label>

                <Textarea
                  id="storeAddress"
                  name="storeAddress"
                  rows={3}
                  value={form.storeAddress}
                  onChange={handleChange}
                  placeholder="House 12, Road 5, Dhanmondi, Dhaka"
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label
                    htmlFor="storePhone0"
                    className="flex items-center gap-1"
                  >
                    <Phone className="h-4 w-4" />
                    Primary Phone <span className="text-red-500">*</span>
                  </Label>

                  <Input
                    id="storePhone0"
                    type="tel"
                    value={form.storePhone[0]}
                    onChange={(e) =>
                      handlePhoneChange(0, e.target.value)
                    }
                    placeholder="+8801XXXXXXXXX"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="storePhone1"
                    className="flex items-center gap-1"
                  >
                    <Phone className="h-4 w-4" />
                    Secondary Phone (optional)
                  </Label>

                  <Input
                    id="storePhone1"
                    type="tel"
                    value={form.storePhone[1]}
                    onChange={(e) =>
                      handlePhoneChange(1, e.target.value)
                    }
                    placeholder="+8801XXXXXXXXX"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Return Policy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Return Policy
              </CardTitle>

              <CardDescription>
                Add the return policy displayed to your customers.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="returnPolicy">Return Policy Details</Label>

                <Textarea
                  id="returnPolicy"
                  name="returnPolicy"
                  rows={6}
                  value={form.returnPolicy}
                  onChange={handleChange}
                  placeholder="Write your return policy here..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={!isDirty || saving}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>

            <Button
              type="submit"
              disabled={saving || (exists && !isDirty)}
            >
              <Save className="mr-2 h-4 w-4" />
              {saving
                ? "Saving..."
                : exists
                  ? "Update Store Info"
                  : "Create Store Info"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
