import { Edit3, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { ProductDialog } from "@/components/product-dialog";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Input, Select } from "@/components/ui/input";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { formatCurrency } from "@/lib/utils";

// =====================================================
// API
// =====================================================

const API_ORIGIN = "https://nova-market-backend-2.onrender.com";

const API_BASE = `${API_ORIGIN}/api/v1`;

const ALL_PRODUCTS_URL =
  `${API_BASE}/product/allProduct`;

const CREATE_PRODUCT_URL =
  `${API_BASE}/product/createProduct`;

const updateProductUrl = (id) =>
  `${API_BASE}/product/updateProduct/${id}`;

const deleteProductUrl = (id) =>
  `${API_BASE}/product/deleteProduct/${id}`;

// =====================================================
// Normalize Status
// =====================================================

function normalizeStatus(status, stock) {
  const value = String(
    status || "active"
  ).toLowerCase();

  const statuses = {
    active: "Active",
    inactive: "Inactive",
    pending: "Pending",
    "low stock": "Low Stock",
    low_stock: "Low Stock",
    out_of_stock: "Out of Stock",
    "out of stock": "Out of Stock",
  };

  if (
    value === "inactive" ||
    value === "pending"
  ) {
    return statuses[value];
  }

  if (Number(stock) === 0) {
    return "Out of Stock";
  }

  if (
    Number(stock) > 0 &&
    Number(stock) <= 8
  ) {
    return "Low Stock";
  }

  return statuses[value] || "Active";
}

// =====================================================
// Image From Product
// =====================================================

function imageFromProduct(product) {
  if (
    typeof product.image === "string" &&
    product.image.trim()
  ) {
    const image = product.image.trim();

    return image.startsWith("http")
      ? image
      : `${API_ORIGIN}${image}`;
  }

  const images = Array.isArray(product.images)
    ? product.images
    : [];

  const mainImage =
    images.find(
      (image) => image?.isMain
    ) || images[0];

  const imageUrl =
    typeof mainImage === "string"
      ? mainImage
      : mainImage?.url ||
        mainImage?.secure_url ||
        "";

  if (!imageUrl) {
    return "";
  }

  return imageUrl.startsWith("http")
    ? imageUrl
    : `${API_ORIGIN}${imageUrl}`;
}

// =====================================================
// Normalize Discount Type
// =====================================================

function normalizeDiscountType(type) {
  const value = String(
    type || "none"
  ).toLowerCase();

  return [
    "flat",
    "percentage",
    "none",
  ].includes(value)
    ? value
    : "none";
}

// =====================================================
// Calculate Final Discount Price
// =====================================================

function calculateFinalDiscountPrice({
  price,
  discountType,
  discountValue,
}) {
  const productPrice = Number(
    price || 0
  );

  const value = Number(
    discountValue || 0
  );

  if (productPrice <= 0) {
    return 0;
  }

  if (
    discountType === "none" ||
    value <= 0
  ) {
    return productPrice;
  }

  if (discountType === "flat") {
    return Math.max(
      productPrice - value,
      0
    );
  }

  if (
    discountType === "percentage"
  ) {
    const discountAmount =
      (productPrice * value) / 100;

    return Math.max(
      productPrice - discountAmount,
      0
    );
  }

  return productPrice;
}

// =====================================================
// Calculate Discount Value From Final Price
// =====================================================

function calculateDiscountValueFromPrice({
  price,
  discountType,
  discountPrice,
}) {
  const productPrice = Number(
    price || 0
  );

  const finalPrice = Number(
    discountPrice || 0
  );

  if (
    productPrice <= 0 ||
    finalPrice >= productPrice
  ) {
    return "";
  }

  if (discountType === "flat") {
    return productPrice - finalPrice;
  }

  if (
    discountType === "percentage"
  ) {
    return Math.round(
      ((productPrice - finalPrice) /
        productPrice) *
        100
    );
  }

  return "";
}

// =====================================================
// Normalize Product
// =====================================================

function normalizeProduct(product) {
  const stock = Number(
    product.stock ?? 0
  );

  const price = Number(
    product.price ?? 0
  );

  const discountType =
    normalizeDiscountType(
      product.discountType
    );

  // ===================================================
  // Discount Value
  // ===================================================

  let discountValue =
    product.discountValue;

  if (
    discountValue === undefined ||
    discountValue === null ||
    discountValue === ""
  ) {
    discountValue =
      calculateDiscountValueFromPrice({
        price,
        discountType,
        discountPrice:
          product.discountPrice,
      });
  }

  // ===================================================
  // Discount Price
  // ===================================================

  let discountPrice = price;

  if (
    discountType !== "none" &&
    Number(discountValue) > 0
  ) {
    discountPrice =
      calculateFinalDiscountPrice({
        price,
        discountType,
        discountValue,
      });
  }

  if (
    discountType !== "none" &&
    product.discountPrice !==
      undefined &&
    product.discountPrice !== null &&
    Number(product.discountPrice) <
      price
  ) {
    discountPrice = Number(
      product.discountPrice
    );
  }

  // ===================================================
  // Existing Images
  // ===================================================

  const existingImages =
    Array.isArray(product.images)
      ? product.images.map(
          (image, index) => ({
            ...image,

            _id:
              image?._id ||
              `existing-${index}`,

            url:
              image?.url || "",

            isMain:
              Boolean(
                image?.isMain
              ),
          })
        )
      : [];

  const mainImage =
    existingImages.find(
      (image) => image.isMain
    );

  const image =
    imageFromProduct(product);

  return {
    id:
      product._id ||
      product.id ||
      `prd-${Date.now()}`,

    title:
      product.title ||
      "Untitled product",

    sku:
      product.sku || "",

    brand:
      product.brand || "",

    category:
      product.category || "",

    subCategory:
      product.subCategory || "",

    tag:
      Array.isArray(product.tag)
        ? product.tag.join(", ")
        : product.tag || "",

    description:
      product.description || "",

    shortDescription:
      product.shortDescription || "",

    additionalInfo:
      product.additionalInfo || "",

    features:
      Array.isArray(
        product.features
      )
        ? product.features
        : [],

    specifications:
      Array.isArray(
        product.specifications
      )
        ? product.specifications
        : [],

    // Price
    price,

    originalPrice: price,

    discountPrice,

    discountType,

    discountValue:
      discountValue === undefined ||
      discountValue === null
        ? ""
        : String(discountValue),

    // Discount dates
    discountStartDate:
      product.discountStartDate ||
      "",

    discountEndDate:
      product.discountEndDate ||
      "",

    // Inventory
    stock,

    sold:
      Number(product.sold ?? 0),

    rating:
      Number(product.rating ?? 4.5),

    status:
      normalizeStatus(
        product.status,
        stock
      ),

    // Image
    image,

    // Existing images
    existingImages,

    mainKey:
      mainImage?._id ||
      (
        existingImages.length > 0
          ? "existing-0"
          : null
      ),

    raw: product,
  };
}

// =====================================================
// Backend Status
// =====================================================

function backendStatus(status) {
  return String(
    status || "active"
  )
    .toLowerCase()
    .replaceAll(" ", "_");
}

// =====================================================
// Normalize Date
// =====================================================

function normalizeDate(dateValue) {
  if (!dateValue) {
    return null;
  }

  const date = new Date(dateValue);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  date.setHours(
    0,
    0,
    0,
    0
  );

  return date;
}

// =====================================================
// Get Discount Status
// =====================================================

function getDiscountStatus(product) {
  const discountType =
    normalizeDiscountType(
      product.discountType
    );

  const discountValue =
    Number(
      product.discountValue || 0
    );

  const startDate =
    normalizeDate(
      product.discountStartDate
    );

  const endDate =
    normalizeDate(
      product.discountEndDate
    );

  const today = new Date();

  today.setHours(
    0,
    0,
    0,
    0
  );

  // No discount
  if (
    discountType === "none" ||
    discountValue <= 0
  ) {
    return "none";
  }

  // Date missing
  if (
    !startDate ||
    !endDate
  ) {
    return "none";
  }

  // Upcoming
  if (
    today < startDate
  ) {
    return "upcoming";
  }

  // Active
  if (
    today >= startDate &&
    today <= endDate
  ) {
    return "active";
  }

  // Expired
  if (
    today > endDate
  ) {
    return "expired";
  }

  return "none";
}

// =====================================================
// Format Discount Date
// =====================================================

function formatDiscountDate(
  dateValue
) {
  if (!dateValue) {
    return "-";
  }

  const date =
    normalizeDate(
      dateValue
    );

  if (!date) {
    return "-";
  }

  return date.toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

// =====================================================
// Build Product FormData
// =====================================================

function buildProductPayload(
  product
) {
  const payload =
    new FormData();

  // ===================================================
  // Basic Information
  // ===================================================

  payload.append(
    "title",
    product.title || ""
  );

  payload.append(
    "description",
    product.description || ""
  );

  payload.append(
    "shortDescription",
    product.shortDescription || ""
  );

  payload.append(
    "price",
    product.price ?? 0
  );

  payload.append(
    "sku",
    product.sku || ""
  );

  payload.append(
    "stock",
    product.stock ?? 0
  );

  // Brand
  if (
    Array.isArray(
      product.brand
    )
  ) {
    payload.append(
      "brand",
      JSON.stringify(
        product.brand
      )
    );
  } else {
    payload.append(
      "brand",
      product.brand || ""
    );
  }

  payload.append(
    "category",
    product.category || ""
  );

  payload.append(
    "subCategory",
    product.subCategory || ""
  );

  payload.append(
    "tag",
    product.tag || ""
  );

  payload.append(
    "status",
    backendStatus(
      product.status
    )
  );

  payload.append(
    "additionalInfo",
    product.additionalInfo || ""
  );

  // ===================================================
  // Features
  // ===================================================

  const cleanFeatures =
    Array.isArray(
      product.features
    )
      ? product.features
          .map((feature) =>
            String(
              feature
            ).trim()
          )
          .filter(Boolean)
      : String(
          product.features || ""
        )
          .split(",")
          .map((feature) =>
            feature.trim()
          )
          .filter(Boolean);

  payload.append(
    "features",
    JSON.stringify(
      cleanFeatures
    )
  );

  // ===================================================
  // Specifications
  // ===================================================

  payload.append(
    "specifications",
    JSON.stringify(
      Array.isArray(
        product.specifications
      )
        ? product.specifications
        : []
    )
  );

  // ===================================================
  // Discount
  // ===================================================

  const discountType =
    normalizeDiscountType(
      product.discountType
    );

  payload.append(
    "discountType",
    discountType
  );

  // No discount
  if (
    discountType === "none"
  ) {
    payload.append(
      "discountValue",
      "0"
    );

    payload.append(
      "discountPrice",
      String(
        product.price ?? 0
      )
    );

    payload.append(
      "discountStartDate",
      ""
    );

    payload.append(
      "discountEndDate",
      ""
    );
  }

  // With discount
  else {
    const discountValue =
      Number(
        product.discountValue || 0
      );

    const finalDiscountPrice =
      calculateFinalDiscountPrice({
        price:
          product.price,
        discountType,
        discountValue,
      });

    payload.append(
      "discountValue",
      String(
        discountValue
      )
    );

    payload.append(
      "discountPrice",
      String(
        finalDiscountPrice
      )
    );

    payload.append(
      "discountStartDate",
      product.discountStartDate ||
        ""
    );

    payload.append(
      "discountEndDate",
      product.discountEndDate ||
        ""
    );
  }

  // ===================================================
  // Existing Images
  // ===================================================

  if (
    Array.isArray(
      product.existingImages
    )
  ) {
    const updatedExisting =
      product.existingImages.map(
        (image, index) => ({
          ...(image?._id
            ? {
                _id:
                  image._id,
              }
            : {}),

          url:
            image?.url || "",

          isMain:
            product.mainKey ===
            (
              image?._id ||
              `existing-${index}`
            ),
        })
      );

    payload.append(
      "existingImages",
      JSON.stringify(
        updatedExisting
      )
    );
  }

  // ===================================================
  // New Images
  // ===================================================

  if (
    Array.isArray(
      product.images
    )
  ) {
    product.images.forEach(
      (file) => {
        if (
          file instanceof File
        ) {
          payload.append(
            "images",
            file
          );
        }
      }
    );

    payload.append(
      "newMainIndex",
      product.mainIndex >= 0
        ? String(
            product.mainIndex
          )
        : "-1"
    );
  }

  return payload;
}

// =====================================================
// Products Page
// =====================================================

export function ProductsPage({
  products,
  setProducts,
}) {
  // ===================================================
  // States
  // ===================================================

  const [query, setQuery] =
    useState("");

  const [status, setStatus] =
    useState("All");

  const [dialogOpen, setDialogOpen] =
    useState(false);

  const [editing, setEditing] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  // Page error
  const [error, setError] =
    useState("");

  // IMPORTANT:
  // Add / Update form-er error
  const [dialogError, setDialogError] =
    useState("");

  // ===================================================
  // Fetch Products
  // ===================================================

  const fetchProducts =
    async () => {
      setLoading(true);
      setError("");

      try {
        const response =
          await fetch(
            ALL_PRODUCTS_URL
          );

        if (!response.ok) {
          throw new Error(
            "Failed to load products"
          );
        }

        const data =
          await response.json();

        const productList =
          data.allProduct ||
          data.productData ||
          data.data ||
          [];

        setProducts(
          productList.map(
            normalizeProduct
          )
        );
      } catch (err) {
        console.error(err);

        setError(
          err.message ||
            "Product load kora jayni."
        );
      } finally {
        setLoading(false);
      }
    };

  // ===================================================
  // Initial Fetch
  // ===================================================

  useEffect(() => {
    fetchProducts();
  }, []);

  // ===================================================
  // Current Time
  // ===================================================

  const [, setCurrentTime] =
    useState(new Date());

  useEffect(() => {
    const timer =
      setInterval(() => {
        setCurrentTime(
          new Date()
        );
      }, 60000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  // ===================================================
  // Filter Products
  // ===================================================

  const filtered =
    useMemo(() => {
      return products.filter(
        (product) => {
          const matchesQuery =
            [
              product.title,
              product.sku,
              product.category,
            ]
              .join(" ")
              .toLowerCase()
              .includes(
                query.toLowerCase()
              );

          const matchesStatus =
            status === "All" ||
            product.status ===
              status;

          return (
            matchesQuery &&
            matchesStatus
          );
        }
      );
    }, [
      products,
      query,
      status,
    ]);

  // ===================================================
  // Save Product
  // Add + Update
  // ===================================================

  const saveProduct =
    async (product) => {
      setSaving(true);

      // Clear old dialog error
      setDialogError("");

      // Clear page error
      setError("");

      try {
        const isEditing =
          Boolean(editing);

        const url =
          isEditing
            ? updateProductUrl(
                product.id
              )
            : CREATE_PRODUCT_URL;

        const response =
          await fetch(
            url,
            {
              method: "POST",
              body:
                buildProductPayload(
                  product
                ),
            }
          );

        const responseData =
          await response
            .json()
            .catch(() => null);

        // =============================================
        // Backend Error
        // =============================================

        if (!response.ok) {
          const backendMessage =
            responseData?.message ||
            responseData?.error ||
            responseData?.errors?.[0]
              ?.message ||
            "Failed to save product";

          throw new Error(
            backendMessage
          );
        }

        // =============================================
        // Success
        // =============================================

        await fetchProducts();

        // Clear form error
        setDialogError("");

        // Close dialog
        setDialogOpen(false);

        setEditing(null);

      } catch (err) {
        console.error(
          "Product save error:",
          err
        );

        // =============================================
        // IMPORTANT
        // Dialog open থাকবে
        // Error dialog-এর ভিতরে যাবে
        // =============================================

        setDialogError(
          err.message ||
            (
              editing
                ? "Product update hoyni."
                : "Product add hoyni."
            )
        );

        // Dialog close হবে না
        setDialogOpen(true);

      } finally {
        setSaving(false);
      }
    };

  // ===================================================
  // Delete Product
  // ===================================================

  const deleteProduct =
    async (id) => {
      const confirmed =
        window.confirm(
          "Are you sure you want to delete this product?"
        );

      if (!confirmed) {
        return;
      }

      setError("");

      try {
        const response =
          await fetch(
            deleteProductUrl(id),
            {
              method: "DELETE",
            }
          );

        const responseData =
          await response
            .json()
            .catch(() => null);

        if (!response.ok) {
          throw new Error(
            responseData?.message ||
              "Failed to delete product"
          );
        }

        setProducts(
          (current) =>
            current.filter(
              (product) =>
                product.id !== id
            )
        );

      } catch (err) {
        console.error(err);

        setError(
          err.message ||
            "Product delete hoyni."
        );
      }
    };

  // ===================================================
  // Add Product
  // ===================================================

  const handleAddProduct =
    () => {
      setEditing(null);

      // Old error clear
      setDialogError("");

      setDialogOpen(true);
    };

  // ===================================================
  // Edit Product
  // ===================================================

  const handleEditProduct =
    (product) => {
      setEditing(product);

      // Old error clear
      setDialogError("");

      setDialogOpen(true);
    };

  // ===================================================
  // Close Dialog
  // ===================================================

  const handleCloseDialog =
    () => {
      setDialogOpen(false);

      setEditing(null);

      // Error clear
      setDialogError("");
    };

  // ===================================================
  // Render
  // ===================================================

  return (
    <div className="space-y-6">

      {/* =================================================
          Header
      ================================================= */}

      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">

        <div>
          <h2 className="text-3xl font-bold tracking-normal">
            Products
          </h2>

          <p className="mt-2 text-muted-foreground">
            Add, edit, filter and manage
            product inventory.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">

          <Button
            variant="outline"
            onClick={fetchProducts}
            disabled={loading}
          >
            {loading
              ? "Loading..."
              : "Reload API"}
          </Button>

          <Button
            onClick={
              handleAddProduct
            }
          >
            <Plus className="h-4 w-4" />

            Add Product
          </Button>

        </div>
      </div>

      {/* =================================================
          Page Error
      ================================================= */}

      {error && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error}
        </div>
      )}

      {/* =================================================
          Product Table
      ================================================= */}

      <Card>

        <CardHeader>

          <CardTitle>
            Product Management
          </CardTitle>

          <CardDescription>
            {filtered.length} products
            showing from{" "}
            {products.length} total
          </CardDescription>

        </CardHeader>

        <CardContent>

          {/* Search + Filter */}

          <div className="mb-4 grid gap-3 md:grid-cols-[1fr_180px]">

            <div className="relative">

              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

              <Input
                className="pl-9"
                placeholder="Search product, SKU or category"
                value={query}
                onChange={(event) =>
                  setQuery(
                    event.target.value
                  )
                }
              />

            </div>

            <Select
              value={status}
              onChange={(event) =>
                setStatus(
                  event.target.value
                )
              }
            >

              <option>
                All
              </option>

              <option>
                Active
              </option>

              <option>
                Pending
              </option>

              <option>
                Low Stock
              </option>

              <option>
                Out of Stock
              </option>

              <option>
                Inactive
              </option>

            </Select>

          </div>

          {/* =================================================
              Table
          ================================================= */}

          <Table>

            <TableHeader>

              <TableRow>

                <TableHead>
                  Product
                </TableHead>

                <TableHead>
                  SKU
                </TableHead>

                <TableHead>
                  Main Price
                </TableHead>

                <TableHead>
                  Discount Price
                </TableHead>

                <TableHead>
                  Discount Start Date
                </TableHead>

                <TableHead>
                  Discount End Date
                </TableHead>

                <TableHead>
                  Discount Info
                </TableHead>

                <TableHead>
                  Stock
                </TableHead>

                <TableHead>
                  Status
                </TableHead>

                <TableHead className="text-right">
                  Actions
                </TableHead>

              </TableRow>

            </TableHeader>

            <TableBody>

              {filtered.length === 0 ? (

                <TableRow>

                  <TableCell
                    colSpan={10}
                    className="py-10 text-center text-muted-foreground"
                  >
                    No products found.
                  </TableCell>

                </TableRow>

              ) : (

                filtered.map(
                  (product) => {

                    const discountStatus =
                      getDiscountStatus(
                        product
                      );

                    const isDiscountActive =
                      discountStatus ===
                      "active";

                    return (
                      <TableRow
                        key={
                          product.id
                        }
                      >

                        {/* Product */}

                        <TableCell className="min-w-[260px]">

                          <div className="flex items-center gap-3">

                            {product.image ? (

                              <img
                                src={ product.image }
                                alt={ product.title }
                                className="h-12 w-12 rounded-md object-cover"
                              />

                            ) : (

                              <div className="h-12 w-12 rounded-md border border-dashed border-muted-foreground/30" />

                            )}

                            <div>

                              <p className="font-semibold">
                                {
                                  product.title
                                }
                              </p>

                              {product.brand && (
                                <p className="text-xs text-muted-foreground">

                                  {Array.isArray(
                                    product.brand
                                  )
                                    ? product.brand.join(
                                        ", "
                                      )
                                    : product.brand}

                                </p>
                              )}

                            </div>

                          </div>

                        </TableCell>

                        {/* SKU */}

                        <TableCell cla>
                          <div className="text-[10px]">
   {
                            product.sku ||
                            "-"
                          }
                          </div>
                       
                        </TableCell>

                        {/* Main Price */}

                        <TableCell>

                          <span
                            className={
                              isDiscountActive
                                ? "text-muted-foreground line-through"
                                : "font-semibold"
                            }
                          >
                            {formatCurrency(
                              product.price
                            )}
                          </span>

                        </TableCell>

                        {/* Discount Price */}

                        <TableCell>

                          {isDiscountActive ? (

                            <div className="flex items-center gap-2">

                              <span className="font-semibold text-green-600">
                                {formatCurrency(
                                  product.discountPrice
                                )}
                              </span>

                            </div>

                          ) : (

                            <span className="font-semibold">
                              {formatCurrency(
                                product.price
                              )}
                            </span>

                          )}

                        </TableCell>

                        {/* Discount Start Date */}

                        <TableCell>

                          <span className="text-sm">
                            {formatDiscountDate(
                              product.discountStartDate
                            )}
                          </span>

                        </TableCell>

                        {/* Discount End Date */}

                        <TableCell>

                          <span className="text-sm">
                            {formatDiscountDate(
                              product.discountEndDate
                            )}
                          </span>

                        </TableCell>

                        {/* Discount Info */}

                        <TableCell>

                          {isDiscountActive ? (

                            <div className="flex flex-col gap-.5">

                              <span className="text-[12px] font-semibold text-green-600">

                                {product.discountType ===
                                "flat"
                                  ? `Flat-${product.discountValue}`
                                  : product.discountType ===
                                    "percentage"
                                  ? `${product.discountValue}% Discount`
                                  : "Discount"}

                              </span>

                              <span className="text-[10px] text-green-600">
                                Active
                              </span>

                            </div>

                          ) : discountStatus ===
                            "upcoming" ? (

                            <div className="flex flex-col gap-1">

                              <span className="font-semibold text-amber-600">
                                Upcoming
                              </span>

                              <span className="text-xs text-muted-foreground">
                                Not started yet
                              </span>

                            </div>

                          ) : discountStatus ===
                            "expired" ? (

                            <div className="flex flex-col gap-1">

                              <span className="font-semibold text-red-500">
                                Expired
                              </span>

                              <span className="text-xs text-muted-foreground">
                                Discount ended
                              </span>

                            </div>

                          ) : (

                            <span className="font-semibold text-red-400">
                              No discount
                            </span>

                          )}

                        </TableCell>

                        {/* Stock */}

                        <TableCell>
                          {
                            product.stock
                          }
                        </TableCell>

                        {/* Status */}

                        <TableCell>

                          <StatusBadge
                            status={
                              product.status
                            }
                          />

                        </TableCell>

                        {/* Actions */}

                        <TableCell>

                          <div className="flex justify-end gap-2">

                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() =>
                                handleEditProduct(
                                  product
                                )
                              }
                              aria-label="Edit product"
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-rose-600"
                              onClick={() =>
                                deleteProduct(
                                  product.id
                                )
                              }
                              aria-label="Delete product"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>

                          </div>

                        </TableCell>

                      </TableRow>
                    );
                  }
                )

              )}

            </TableBody>

          </Table>

        </CardContent>

      </Card>

      {/* =================================================
          Product Dialog
      ================================================= */}

      <ProductDialog
        open={dialogOpen}
        product={editing}
        onClose={
          handleCloseDialog
        }
        onSave={saveProduct}
        saving={saving}

        error={dialogError}
      />

    </div>
  );
}