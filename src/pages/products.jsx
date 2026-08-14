import { Edit3, Plus, Search, Star, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ProductDialog } from "@/components/product-dialog";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { calculateDiscountPrice } from "@/lib/discount";
import { formatCurrency } from "@/lib/utils";

const API_ORIGIN = "https://emart-singlevendor-backend-6.onrender.com";
const API_BASE = `${API_ORIGIN}/api/v1`;
const ALL_PRODUCTS_URL = `${API_BASE}/product/allProduct`;
const CREATE_PRODUCT_URL = `${API_BASE}/product/createProduct`;
const updateProductUrl = (id) => `${API_BASE}/product/updateProduct/${id}`;
const deleteProductUrl = (id) => `${API_BASE}/product/deleteProduct/${id}`;

const placeholderImage =
  "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?auto=format&fit=crop&w=240&q=80";

function normalizeStatus(status, stock) {
  const value = String(status || "Active").toLowerCase();
  const statuses = {
    active: "Active",
    inactive: "Inactive",
    pending: "Pending",
    "low stock": "Low Stock",
    low_stock: "Low Stock",
    out_of_stock: "Out of Stock",
    "out of stock": "Out of Stock",
  };

  if (value === "inactive" || value === "pending") return statuses[value];
  if (Number(stock) === 0) return "Out of Stock";
  if (Number(stock) > 0 && Number(stock) <= 8) return "Low Stock";
  return statuses[value] || "Active";
}

function imageFromProduct(product) {
  if (typeof product.image === "string" && product.image) return product.image;

  const images = Array.isArray(product.images) ? product.images : [];
  const mainImage = images.find((image) => image.isMain) || images[0];
  const imageUrl = mainImage?.url || mainImage?.secure_url || mainImage;

  if (!imageUrl || typeof imageUrl !== "string") return placeholderImage;
  return imageUrl.startsWith("http") ? imageUrl : `${API_ORIGIN}${imageUrl}`;
}

function normalizeProduct(product) {
  const stock = Number(product.stock ?? 0);
  const price = Number(product.price ?? 0);
  const rawDiscountPrice = Number(product.discountPrice ?? product.price ?? 0);
  const discountType = normalizeDiscountType(product.discountType);
  const discountValue =
    product.discountValue ??
    (discountType === "flat" && price > rawDiscountPrice
      ? price - rawDiscountPrice
      : discountType === "percentage" && price > rawDiscountPrice
        ? Math.round(((price - rawDiscountPrice) / price) * 100)
        : "");
  const discountPrice = calculateDiscountPrice({
    price,
    discountType,
    discountValue,
    discountStartDate: product.discountStartDate,
    discountEndDate: product.discountEndDate,
    fallbackDiscountPrice: rawDiscountPrice,
  });

  return {
    id: product._id || product.id || `prd-${Date.now()}`,
    title: product.title || "Untitled product",
    sku: product.sku,
    brand: product.brand,
    category: product.category,
    subCategory: product.subCategory,
    tag: Array.isArray(product.tag) ? product.tag.join(", ") : product.tag || "",
    description: product.description || "",
    shortDescription: product.shortDescription || "",
    additionalInfo: product.additionalInfo || "",
    price,
    originalPrice: Number(product.originalPrice ?? product.price ?? 0),
    discountPrice,
    discountType,
    discountValue: discountValue === undefined || discountValue === null ? "" : String(discountValue),
    discountStartDate: product.discountStartDate || "",
    discountEndDate: product.discountEndDate || "",
    stock,
    sold: Number(product.sold ?? 0),
    rating: Number(product.rating ?? 4.5),
    status: normalizeStatus(product.status, stock),
    image: imageFromProduct(product),
    raw: product,
  };
}

function backendStatus(status) {
  return String(status || "active").toLowerCase().replaceAll(" ", "_");
}

function normalizeDiscountType(type) {
  const value = String(type || "none").toLowerCase();
  return ["flat", "percentage", "none"].includes(value) ? value : "none";
}

function buildProductPayload(product) {
  const payload = new FormData();

  payload.append("title", product.title);
  payload.append("description", product.description || "");
  payload.append("shortDescription", product.shortDescription || "");
  payload.append("price", product.price);
  payload.append("sku", product.sku);
  payload.append("stock", product.stock);
  payload.append("brand", product.brand);
  payload.append("category", product.category);
  payload.append("subCategory", product.subCategory || "");
  payload.append("tag", product.tag || "");
  payload.append("status", backendStatus(product.status));
  payload.append("additionalInfo", product.additionalInfo || "");
  const discountType = normalizeDiscountType(product.discountType);
  payload.append("discountType", discountType);

  if (discountType !== "none") {
    payload.append("discountValue", product.discountValue || 0);
    payload.append("discountStartDate", product.discountStartDate || "");
    payload.append("discountEndDate", product.discountEndDate || "");
    payload.append("discountPrice", product.discountPrice || product.price);
  }

  if (product.existingImages) {
    const updatedExisting = product.existingImages.map((image, index) => ({
      ...image,
      isMain: product.mainKey === (image._id || `existing-${index}`),
    }));
    payload.append("existingImages", JSON.stringify(updatedExisting));
  }

  if (Array.isArray(product.images)) {
    product.images.forEach((file) => payload.append("images", file));
    payload.append("isMain", product.mainIndex >= 0 ? product.mainIndex : 0);
    payload.append("newMainIndex", product.mainIndex ?? -1);
  }

  return payload;
}

export function ProductsPage({ products, setProducts }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchProducts = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(ALL_PRODUCTS_URL);
      if (!response.ok) throw new Error("Failed to load products");

      const data = await response.json();
      const productList = data.products || data.productData || data.data || [];
      setProducts(productList.map(normalizeProduct));
    } catch (err) {
      setError("Live API theke product load kora jayni. Demo data ekhono dekhacche.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filtered = useMemo(() => {
    return products.filter((product) => {
      const matchesQuery = [product.title, product.sku, product.category]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchesStatus = status === "All" || product.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [products, query, status]);

  const saveProduct = async (product) => {
    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        editing ? updateProductUrl(product.id) : CREATE_PRODUCT_URL,
        {
          method: editing ? "POST" : "POST",
          body: buildProductPayload(product),
        },
      );

      if (!response.ok) throw new Error("Failed to save product");

      await fetchProducts();
      setDialogOpen(false);
      setEditing(null);
    } catch (err) {
      setError("Product save hoyni. Backend endpoint/auth/CORS check korte hobe.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (id) => {
    setError("");

    try {
      const response = await fetch(deleteProductUrl(id), { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete product");

      setProducts((current) => current.filter((product) => product.id !== id));
    } catch (err) {
      setError("Product delete hoyni. Backend endpoint/auth/CORS check korte hobe.");
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-normal">Products</h2>
          <p className="mt-2 text-muted-foreground">Add, edit, filter and manage E-Earbuds inventory.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={fetchProducts} disabled={loading}>
            {loading ? "Loading..." : "Reload API"}
          </Button>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Product Management</CardTitle>
          <CardDescription>{filtered.length} products showing from {products.length} total</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid gap-3 md:grid-cols-[1fr_180px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search product, SKU or category" value={query} onChange={(event) => setQuery(event.target.value)} />
            </div>
            <Select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option>All</option>
              <option>Active</option>
              <option>Pending</option>
              <option>Low Stock</option>
              <option>Out of Stock</option>
              <option>Inactive</option>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Main Price</TableHead>
                <TableHead>Discount Price</TableHead>
                <TableHead>Discount info</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="min-w-[260px]">
                    <div className="flex items-center gap-3">
                      <img src={product.image} alt={product.title} className="h-12 w-12 rounded-md object-cover" />
                      <div>
                        <p className="font-semibold">{product.title}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{[product.sku]}</TableCell>
                  <TableCell>{product.price}</TableCell>
                  <TableCell>
                    <span className="font-semibold">{formatCurrency(product.discountPrice)}</span>
                    {product.originalPrice > product.price && (
                      <span className="ml-2 text-xs text-muted-foreground line-through">{formatCurrency(product.originalPrice)}mmmmmmmmm</span>
                    )}
                  </TableCell>
                  <TableCell className={
                    product.price == product.discountPrice
                      ? "text-red-400 font-semibold"
                      : "text-green-600 font-semibold"
                  }>

                    {product.price == product.discountPrice ? "No discount" : "Discount"}</TableCell>
                  <TableCell>{product.stock}</TableCell>
                  <TableCell><StatusBadge status={product.status} /></TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="icon" onClick={() => { setEditing(product); setDialogOpen(true); }} aria-label="Edit product">
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-rose-600" onClick={() => deleteProduct(product.id)} aria-label="Delete product">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ProductDialog
        open={dialogOpen}
        product={editing}
        onClose={() => {
          setDialogOpen(false);
          setEditing(null);
        }}
        onSave={saveProduct}
        saving={saving}
      />
    </div>
  );
}
