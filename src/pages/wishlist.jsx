import { HeartOff, ImageOff } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

const API_ORIGIN = "https://nova-market-backend-2.onrender.com";
const API_BASE = `${API_ORIGIN}/api/v1`;
const ALL_WISHLIST_URL = `${API_BASE}/wishlist/allWishlist`;

const formatPrice = (value) =>
    typeof value === "number" ? `৳${value.toLocaleString("en-BD")}` : "—";

// isMain: true wala image nibe, na thakle prothom image
function getMainImage(product) {
    const images = product?.images;

    if (!Array.isArray(images) || images.length === 0) return "";

    const main = images.find((img) => img?.isMain) || images[0];

    return typeof main === "string" ? main : main?.url || "";
}

function ProductThumb({ src, alt }) {
    const [failed, setFailed] = useState(false);

    return (
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted sm:h-16 sm:w-16">
            {src && !failed ? (
                <img
                    src={src}
                    alt={alt}
                    loading="lazy"
                    className="h-full w-full object-cover"
                    onError={() => setFailed(true)}
                />
            ) : (
                <ImageOff className="h-5 w-5 text-muted-foreground" />
            )}
        </div>
    );
}

export function Wishlist() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const fetchWishlist = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await fetch(ALL_WISHLIST_URL, {
                headers: {},
            });

            if (!response.ok) {
                throw new Error("Failed to load wishlist.");
            }

            const data = await response.json();

            setItems(Array.isArray(data?.data) ? data.data : []);
        } catch (err) {
            console.error("Wishlist fetch error:", err);

            setError(err.message || "Wishlist load kora jayni.");
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWishlist();
    }, []);

    const groupedUsers = useMemo(() => {
        const map = new Map();

        items.forEach((row) => {
            const user = row.userId;
            if (!user) return;

            if (!map.has(user._id)) {
                map.set(user._id, { user, products: [] });
            }

            if (row.productId) {
                map.get(user._id).products.push({
                    wishlistId: row._id,
                    ...row.productId,
                });
            }
        });

        return Array.from(map.values());
    }, [items]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-3xl font-bold tracking-normal">
                            All Wishlist
                        </h2>

                        <span className="rounded-lg bg-primary px-3 py-1 text-lg font-semibold text-primary-foreground">
                            {items.length}
                        </span>
                    </div>

                    <p className="mt-2 text-muted-foreground">
                        Every product saved to a wishlist, grouped by customer.
                    </p>
                </div>

                <Button
                    variant="outline"
                    onClick={fetchWishlist}
                    disabled={loading}
                >
                    {loading ? "Loading..." : "Reload"}
                </Button>
            </div>

            {/* Error */}
            {error && (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    {error}
                </div>
            )}

            {/* List */}
            <Card>
                <CardHeader>
                    <CardTitle>Customer Wishlists</CardTitle>

                    <CardDescription>
                        <span className="font-bold">{groupedUsers.length}</span> customers,{" "}
                        <span className="font-bold">{items.length}</span> wishlist items
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                            Loading wishlist...
                        </div>
                    ) : groupedUsers.length ? (
                        <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
                            {groupedUsers.map(({ user, products }) => (
                                <div
                                    key={user._id}
                                    className="overflow-hidden rounded-lg border md:grid md:grid-cols-[260px_1fr]"
                                >
                                    {/* User info */}
                                    <div className="min-w-0 space-y-1 border-b bg-muted p-4 md:border-b-0 md:border-r">
                                        <p className="font-semibold">{user.name}</p>

                                        <p className="break-all text-sm text-muted-foreground">
                                            {user.email}
                                        </p>

                                        <p className="text-sm text-muted-foreground">
                                            {user.address || "Address not available"}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {user.postalCode || "Postal code not available"}
                                        </p>

                                        <p className="break-all text-sm text-muted-foreground">
                                            {user.phone || "Phone not available"}
                                        </p>
                                        <p className="break-all text-sm text-muted-foreground">
                                            {user.createdAt
                                                ? new Date(user.createdAt).toLocaleDateString("en-GB", {
                                                    day: "numeric",
                                                    month: "short",
                                                    year: "numeric",
                                                })
                                                : "N/A"}
                                        </p>

                                    </div>

                                    {/* Products */}
                                    <ul className="min-w-0 divide-y px-4">
                                        {products.map((product, index) => (
                                            <li
                                                key={product.wishlistId}
                                                className="flex items-center gap-3 py-3"
                                            >
                                                <span className="shrink-0 rounded-md border bg-muted px-2 py-0.5 text-xs font-semibold">
                                                    Item -{index + 1}
                                                </span>

                                                <div className="min-w-0 flex-1">
                                                    <p className="break-words font-medium">
                                                        {product.title}
                                                    </p>

                                                    <div className="mt-0.5 flex flex-wrap items-baseline gap-x-3 text-sm">
                                                        <span className="text-muted-foreground line-through">
                                                            {formatPrice(product.price)}
                                                        </span>

                                                        <span className="font-semibold text-primary">
                                                            {formatPrice(product.discountPrice)}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Product image (right side) */}
                                                <ProductThumb
                                                    src={getMainImage(product)}
                                                    alt={product.title}
                                                />
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
                            <HeartOff className="h-8 w-8" />

                            <p className="text-sm">No wishlist items yet.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
