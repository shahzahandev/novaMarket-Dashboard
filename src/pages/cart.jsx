import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { CalendarDays, Check, CornerLeftUpIcon, MessageSquare, MoveRight, Phone } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";

const API_BASE = "https://nova-market-backend-2.onrender.com/api/v1";
const ALL_CART_URL = `${API_BASE}/cart/all`;

const getImage = (product) =>
  product?.images?.find((img) => img.isMain)?.url || product?.images?.[0]?.url;

export function CartPage() {
  const [carts, setCarts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchCarts() {
      try {
        const res = await axios.get(ALL_CART_URL);
        setCarts(res.data.card || []);
      } catch (err) {
        setError("Cart data load korte problem hoyeche");
      } finally {
        setLoading(false);
      }
    }
    fetchCarts();
  }, []);

  // User onujayi group kora
  const groupedCarts = useMemo(() => {
    const map = new Map();

    carts.forEach((cart) => {
      const key = cart.user?._id || "unknown";

      if (!map.has(key)) {
        map.set(key, {
          key,
          user: cart.user,
          items: [],
          totalQty: 0,
          grandTotal: 0,
          lastDate: null,
        });
      }

      const group = map.get(key);
      group.items.push(cart);
      group.totalQty += cart.quantity || 0;
      group.grandTotal += cart.totalPrice || 0;

      // sobcheye notun createdAt
      if (cart.createdAt && (!group.lastDate || new Date(cart.createdAt) > new Date(group.lastDate))) {
        group.lastDate = cart.createdAt;
      }
    });

    return Array.from(map.values());
  }, [carts]);

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-normal md:text-3xl">Cart</h2>
        <p className="mt-1 text-sm text-muted-foreground md:mt-2 md:text-base">
          All Customer cart is here
        </p>
      </div>

      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle>All Carts</CardTitle>
          <CardDescription>
           <span className="font-bold"> {groupedCarts.length} </span> Customer & Total <span className="font-bold">{carts.length}</span> Cart Item
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 p-4 pt-0 md:p-6 md:pt-0">
          {loading && <p className="text-sm text-muted-foreground">Loading...</p>}
          {error && <p className="text-sm text-rose-600">{error}</p>}
          {!loading && !error && carts.length === 0 && (
            <p className="text-sm text-muted-foreground">Kono cart item nei</p>
          )}

          {groupedCarts.map((group) => (
            <UserCartCard key={group.key} group={group} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------------- Ek user er cart card ---------------- */
function UserCartCard({ group }) {
  const { user, items, totalQty, grandTotal, lastDate } = group;

  return (
    <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
      {/* Customer header */}
      <div className="flex flex-col gap-3 border-b bg-muted/40 p-3 sm:flex-row sm:items-center sm:justify-between md:p-4">
        <div className="min-w-0">
          <p className="truncate font-semibold">{user?.name || "Unknown user"}</p>
          <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          {lastDate && (
            <p className="mt-1 flex items-center gap-1 text-xs">
              <CalendarDays className="h-3 w-3" />
              Last added: {formatDate(lastDate)}
                <Check className="h-3 w-3" />
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <ContactActions phone={user?.phone} />
          <div className="text-sm">
            <span className="text-muted-foreground">{items.length} item · Qty {totalQty}</span>
          </div>
          <div className="rounded-md bg-primary px-3 py-1 text-sm font-bold text-primary-foreground">
            {formatCurrency(grandTotal)}
          </div>
        </div>
      </div>

      {/* Cart items */}
      <div className="divide-y">
        {items.map((cart) => (
          <CartItemRow key={cart._id} cart={cart} />
        ))}
      </div>
    </div>
  );
}

/* ---------------- Ek ta cart item ---------------- */
function CartItemRow({ cart }) {
  const { product } = cart;
  const image = getImage(product);
  const hasDiscount = product?.discountPrice && product?.discountPrice < product?.price;

  return (
    <div className="flex flex-col gap-3 p-3 md:flex-row md:items-center md:gap-6 md:p-4">
      {/* Product */}
      <div className="flex min-w-0 flex-1 items-start gap-3 md:items-center">
        {image ? (
          <img
            src={image}
            alt={product?.title}
            className="h-16 w-16 shrink-0 rounded-md border object-cover md:h-14 md:w-14"
          />
        ) : (
          <div className="h-16 w-16 shrink-0 rounded-md border bg-muted md:h-14 md:w-14" />
        )}

        <div className="min-w-0">
          <p className="break-words font-medium leading-snug">
            {product?.title || "Product deleted"}
          </p>
          <p className="mt-0.5 text-xs capitalize text-muted-foreground">{product?.category}</p>
          {cart.createdAt && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarDays className="h-3 w-3 shrink-0" />
              Added: {formatDate(cart.createdAt)}
            </p>
          )}
        </div>
      </div>

      {/* Price / Stock / Qty / Total */}
      <div className="grid grid-cols-4 gap-2 rounded-md bg-muted/40 p-2 text-center md:w-[420px] md:shrink-0 md:bg-transparent md:p-0">
        <Stat label="Price">
          <p className="text-sm font-medium">
            {formatCurrency(product?.discountPrice ?? product?.price ?? 0)}
          </p>
          {hasDiscount && (
            <p className="text-[11px] text-muted-foreground line-through">
              {formatCurrency(product.price)}
            </p>
          )}
        </Stat>

        <Stat label="Stock">
          <p className="text-sm font-medium">{product?.stock}</p>
        </Stat>

        <Stat label="Qty">
          <p className="text-sm font-medium">{cart.quantity}</p>
        </Stat>

        <Stat label="Total">
          <p className="text-sm font-bold">{formatCurrency(cart.totalPrice)}</p>
        </Stat>
      </div>
    </div>
  );
}

function Stat({ label, children }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

function ContactActions({ phone }) {
  if (!phone) {
    return <span className="whitespace-nowrap text-sm text-muted-foreground">Phone: Not available</span>;
  }

  return (
    <div className="flex shrink-0 items-center gap-2">
      <span className="text-sm">{phone}</span>
      <Button asChild variant="outline" size="icon" className="h-8 w-8">
        <a href={`tel:${phone}`} aria-label="Call">
          <Phone className="h-4 w-4" />
        </a>
      </Button>
      <Button asChild variant="outline" size="icon" className="h-8 w-8">
        <a href={`sms:${phone}`} aria-label="Message">
          <MessageSquare className="h-4 w-4" />
        </a>
      </Button>
    </div>
  );
}