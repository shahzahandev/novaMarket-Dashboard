import { Save, Store } from "lucide-react";
import { useEffect, useState } from "react";

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

const API_ORIGIN = "https://nova-market-backend-2.onrender.com";
const API_BASE = `${API_ORIGIN}/api/v1`;
const CREATE_URL = `${API_BASE}/store/createStoreInfo`;
// backend route-e typo ache: "udateStoreInfo" (route fix korle ekhaneo fix korben)
const UPDATE_URL = `${API_BASE}/store/udateStoreInfo`;

const POLICY_FIELDS = [
    { key: "privacyPolicy", label: "Privacy Policy" },
    { key: "returnPolicy", label: "Return Policy" },
    { key: "shippingPolicy", label: "Shipping Policy" },
    { key: "termsAndConditions", label: "Terms & Conditions" },
];

const EMPTY_FORM = {
    storeName: "",
    storeEmail: "",
    storePolicy: {
        privacyPolicy: "",
        returnPolicy: "",
        shippingPolicy: "",
        termsAndConditions: "",
    },
};

const buildForm = (storeInfo) => ({
    storeName: storeInfo?.storeName || "",
    storeEmail: storeInfo?.storeEmail || "",
    storePolicy: {
        privacyPolicy: storeInfo?.storePolicy?.privacyPolicy || "",
        returnPolicy: storeInfo?.storePolicy?.returnPolicy || "",
        shippingPolicy: storeInfo?.storePolicy?.shippingPolicy || "",
        termsAndConditions: storeInfo?.storePolicy?.termsAndConditions || "",
    },
});

export function StoreInfo() {
    // Global store info (AdminLayout o ekhan theke pay)
    const {
        storeInfo,
        setStoreInfo,
        loading,
        error: loadError,
        refetchStoreInfo,
    } = useStoreInfo();

    const exists = Boolean(storeInfo); // DB-te store info ache kina

    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Context-er data change hole (load / reload / save) form sync hobe
    useEffect(() => {
        setForm(storeInfo ? buildForm(storeInfo) : EMPTY_FORM);
    }, [storeInfo]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSuccess("");
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handlePolicyChange = (key, value) => {
        setSuccess("");
        setForm((prev) => ({
            ...prev,
            storePolicy: { ...prev.storePolicy, [key]: value },
        }));
    };

    const handleReload = () => {
        setError("");
        setSuccess("");
        refetchStoreInfo();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!form.storeName.trim() || !form.storeEmail.trim()) {
            setError("Store name and email are required.");
            return;
        }

        setSaving(true);

        try {
            const response = await fetch(exists ? UPDATE_URL : CREATE_URL, {
                method: exists ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    storeName: form.storeName.trim(),
                    storeEmail: form.storeEmail.trim(),
                    storePolicy: form.storePolicy,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data?.message || "Failed to save store information.");
            }

            // Eta-i main kaj: context update hole AdminLayout sathe sathe change hobe
            setStoreInfo(data?.storeInfo || null);
            setSuccess(data?.message || "Store information saved successfully.");
        } catch (err) {
            console.error("Store info save error:", err);
            setError(err.message || "Store information save kora jayni.");
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
                    <div className="flex items-center gap-3">
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
                        Manage your store name, email and policies shown to customers.
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
                <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    {shownError}
                </div>
            )}

            {/* Success */}
            {success && (
                <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
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
                    {/* Basic info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Store className="h-5 w-5" />
                                Basic Information
                            </CardTitle>

                            <CardDescription>
                                {exists
                                    ? "Update your existing store information."
                                    : "No store information yet. Fill in the form to create it."}
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="storeName">Store Name</Label>
                                <Input
                                    id="storeName"
                                    name="storeName"
                                    value={form.storeName}
                                    onChange={handleChange}
                                    placeholder="Nova Market"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="storeEmail">Store Email</Label>
                                <Input
                                    id="storeEmail"
                                    name="storeEmail"
                                    type="email"
                                    value={form.storeEmail}
                                    onChange={handleChange}
                                    placeholder="support@novamarket.com"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Policies */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Store Policies</CardTitle>

                            <CardDescription>
                                These texts can be shown on your storefront policy pages.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-5">
                            {POLICY_FIELDS.map(({ key, label }) => (
                                <div key={key} className="space-y-2">
                                    <Label htmlFor={key}>{label}</Label>
                                    <Textarea
                                        id={key}
                                        rows={6}
                                        value={form.storePolicy[key]}
                                        onChange={(e) =>
                                            handlePolicyChange(key, e.target.value)
                                        }
                                        placeholder={`Write your ${label.toLowerCase()} here...`}
                                    />
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={saving}>
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