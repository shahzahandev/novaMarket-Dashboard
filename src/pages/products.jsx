// import { Edit3, Plus, Search, Trash2 } from "lucide-react";
// import { useEffect, useMemo, useState } from "react";

// import { ProductDialog } from "@/components/product-dialog";
// import { StatusBadge } from "@/components/status-badge";

// import { Button } from "@/components/ui/button";

// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";

// import { Input, Select } from "@/components/ui/input";

// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";

// import { calculateDiscountPrice } from "@/lib/discount";
// import { formatCurrency } from "@/lib/utils";

// // API
// const API_ORIGIN = "http://localhost:3000";
// const API_BASE = `${API_ORIGIN}/api/v1`;
// const ALL_PRODUCTS_URL = `${API_BASE}/product/allProduct`;
// const CREATE_PRODUCT_URL = `${API_BASE}/product/createProduct`;
// const updateProductUrl = (id) => `${API_BASE}/product/updateProduct/${id}`;
// const deleteProductUrl = (id) => `${API_BASE}/product/deleteProduct/${id}`;

// // Normalize Status
// function normalizeStatus(status, stock) {
//   const value = String(
//     status || "Active"
//   ).toLowerCase();

//   const statuses = {
//     active: "Active",
//     inactive: "Inactive",
//     pending: "Pending",

//     "low stock": "Low Stock",
//     low_stock: "Low Stock",

//     out_of_stock: "Out of Stock",
//     "out of stock": "Out of Stock",
//   };

//   if (
//     value === "inactive" ||
//     value === "pending"
//   ) {
//     return statuses[value];
//   }

//   if (Number(stock) === 0) {
//     return "Out of Stock";
//   }

//   if (
//     Number(stock) > 0 &&
//     Number(stock) <= 8
//   ) {
//     return "Low Stock";
//   }

//   return statuses[value] || "Active";
// }


// // =====================================================
// // Image From Product
// // =====================================================

// function imageFromProduct(product) {
//   if (
//     typeof product.image === "string" &&
//     product.image
//   ) {
//     return product.image;
//   }

//   const images = Array.isArray(product.images)
//     ? product.images
//     : [];

//   const mainImage =
//     images.find(
//       (image) => image.isMain
//     ) || images[0];

//   const imageUrl =
//     mainImage?.url ||
//     mainImage?.secure_url ||
//     mainImage;

//   if (
//     !imageUrl ||
//     typeof imageUrl !== "string"
//   ) {
//     return null;
//   }

//   return imageUrl.startsWith("http")
//     ? imageUrl
//     : `${API_ORIGIN}${imageUrl}`;
// }


// // =====================================================
// // Normalize Discount Type
// // =====================================================

// function normalizeDiscountType(type) {
//   const value = String(
//     type || "none"
//   ).toLowerCase();

//   return [
//     "flat",
//     "percentage",
//     "none",
//   ].includes(value)
//     ? value
//     : "none";
// }


// // =====================================================
// // Calculate Final Discount Price
// // =====================================================

// function calculateFinalDiscountPrice({
//   price,
//   discountType,
//   discountValue,
// }) {
//   const productPrice = Number(
//     price || 0
//   );

//   const value = Number(
//     discountValue || 0
//   );

//   // No valid price
//   if (productPrice <= 0) {
//     return 0;
//   }

//   // No discount value
//   if (value <= 0) {
//     return productPrice;
//   }

//   // Flat discount
//   if (discountType === "flat") {
//     return Math.max(
//       productPrice - value,
//       0
//     );
//   }

//   // Percentage discount
//   if (
//     discountType ===
//     "percentage"
//   ) {
//     const discountAmount =
//       (productPrice * value) /
//       100;

//     return Math.max(
//       productPrice -
//         discountAmount,
//       0
//     );
//   }

//   // No discount
//   return productPrice;
// }


// // =====================================================
// // Normalize Product
// // =====================================================

// function normalizeProduct(product) {
//   const stock = Number(
//     product.stock ?? 0
//   );

//   const price = Number(
//     product.price ?? 0
//   );

//   const rawDiscountPrice =
//     Number(
//       product.discountPrice ??
//         product.price ??
//         0
//     );

//   const discountType =
//     normalizeDiscountType(
//       product.discountType
//     );

//   // -----------------------------------------------
//   // Calculate Discount Value
//   // -----------------------------------------------

//   const discountValue =
//     product.discountValue ??
//     (
//       discountType === "flat" &&
//       price > rawDiscountPrice
//     )
//       ? price -
//         rawDiscountPrice
//       : discountType ===
//           "percentage" &&
//         price > rawDiscountPrice
//       ? Math.round(
//           (
//             (price -
//               rawDiscountPrice) /
//             price
//           ) *
//             100
//         )
//       : "";

//   // -----------------------------------------------
//   // Calculate Discount Price
//   // -----------------------------------------------

//   const discountPrice =
//     calculateDiscountPrice({
//       price,

//       discountType,

//       discountValue,

//       discountStartDate:
//         product.discountStartDate,

//       discountEndDate:
//         product.discountEndDate,

//       fallbackDiscountPrice:
//         rawDiscountPrice,
//     });

//   return {
//     id:
//       product._id ||
//       product.id ||
//       `prd-${Date.now()}`,

//     title:
//       product.title ||
//       "Untitled product",

//     // SKU will be used for display
//     // but backend update controller
//     // should not change SKU.
//     sku: product.sku,

//     brand: product.brand,

//     category:
//       product.category,

//     subCategory:
//       product.subCategory,

//     tag: Array.isArray(
//       product.tag
//     )
//       ? product.tag.join(", ")
//       : product.tag || "",

//     description:
//       product.description || "",

//     shortDescription:
//       product.shortDescription || "",

//     additionalInfo:
//       product.additionalInfo || "",

//     // ---------------------------------------------
//     // Features
//     // ---------------------------------------------

//     features: Array.isArray(
//       product.features
//     )
//       ? product.features
//       : [],

//     // ---------------------------------------------
//     // Specifications
//     // ---------------------------------------------

//     specifications:
//       Array.isArray(
//         product.specifications
//       )
//         ? product.specifications
//         : [],

//     // ---------------------------------------------
//     // Price
//     // ---------------------------------------------

//     price,

//     originalPrice: Number(
//       product.originalPrice ??
//         product.price ??
//         0
//     ),

//     discountPrice,

//     discountType,

//     discountValue:
//       discountValue ===
//         undefined ||
//       discountValue === null
//         ? ""
//         : String(
//             discountValue
//           ),

//     discountStartDate:
//       product.discountStartDate ||
//       "",

//     discountEndDate:
//       product.discountEndDate ||
//       "",

//     // ---------------------------------------------
//     // Inventory
//     // ---------------------------------------------

//     stock,

//     sold: Number(
//       product.sold ?? 0
//     ),

//     rating: Number(
//       product.rating ?? 4.5
//     ),

//     status:
//       normalizeStatus(
//         product.status,
//         stock
//       ),

//     image:
//       imageFromProduct(product),

//     raw: product,
//   };
// }


// // =====================================================
// // Backend Status
// // =====================================================

// function backendStatus(status) {
//   return String(
//     status || "active"
//   )
//     .toLowerCase()
//     .replaceAll(" ", "_");
// }


// // =====================================================
// // Build Product FormData
// // =====================================================

// function buildProductPayload(product) {
//   const payload =
//     new FormData();

//   // =================================================
//   // Basic Product Information
//   // =================================================

//   payload.append(
//     "title",
//     product.title
//   );

//   payload.append(
//     "description",
//     product.description || ""
//   );

//   payload.append(
//     "shortDescription",
//     product.shortDescription || ""
//   );

//   payload.append(
//     "price",
//     product.price
//   );

//   // SKU is sent for create/edit identification,
//   // but backend controller should NOT modify SKU
//   // during update.
//   payload.append(
//     "sku",
//     product.sku
//   );

//   payload.append(
//     "stock",
//     product.stock
//   );

//   payload.append(
//     "brand",
//     product.brand || ""
//   );

//   payload.append(
//     "category",
//     product.category
//   );

//   payload.append(
//     "subCategory",
//     product.subCategory || ""
//   );

//   payload.append(
//     "tag",
//     product.tag || ""
//   );

//   payload.append(
//     "status",
//     backendStatus(
//       product.status
//     )
//   );

//   payload.append(
//     "additionalInfo",
//     product.additionalInfo || ""
//   );


//   // =================================================
//   // Features
//   // =================================================

//   const cleanFeatures =
//     Array.isArray(
//       product.features
//     )
//       ? product.features
//           .map((feature) =>
//             String(
//               feature
//             ).trim()
//           )
//           .filter(Boolean)
//       : String(
//           product.features || ""
//         )
//           .split(",")
//           .map((feature) =>
//             feature.trim()
//           )
//           .filter(Boolean);

//   payload.append(
//     "features",
//     JSON.stringify(
//       cleanFeatures
//     )
//   );


//   // =================================================
//   // Specifications
//   // =================================================

//   payload.append(
//     "specifications",
//     JSON.stringify(
//       product.specifications ||
//         []
//     )
//   );


//   // =================================================
//   // Discount
//   // =================================================

//   const discountType =
//     normalizeDiscountType(
//       product.discountType
//     );

//   payload.append(
//     "discountType",
//     discountType
//   );


//   // =================================================
//   // No Discount
//   // =================================================

//   if (
//     discountType === "none"
//   ) {
//     payload.append(
//       "discountValue",
//       "0"
//     );

//     payload.append(
//       "discountPrice",
//       product.price
//     );

//     payload.append(
//       "discountStartDate",
//       ""
//     );

//     payload.append(
//       "discountEndDate",
//       ""
//     );
//   }


//   // =================================================
//   // Flat / Percentage Discount
//   // =================================================

//   else {
//     const discountValue =
//       Number(
//         product.discountValue ||
//           0
//       );

//     const finalDiscountPrice =
//       calculateFinalDiscountPrice(
//         {
//           price:
//             product.price,

//           discountType,

//           discountValue,
//         }
//       );

//     payload.append(
//       "discountValue",
//       discountValue
//     );

//     payload.append(
//       "discountPrice",
//       finalDiscountPrice
//     );

//     payload.append(
//       "discountStartDate",
//       product.discountStartDate ||
//         ""
//     );

//     payload.append(
//       "discountEndDate",
//       product.discountEndDate ||
//         ""
//     );
//   }


//   // =================================================
//   // Existing Images
//   // =================================================

//   if (
//     product.existingImages
//   ) {
//     const updatedExisting =
//       product.existingImages.map(
//         (image, index) => ({
//           ...image,

//           isMain:
//             product.mainKey ===
//             (
//               image._id ||
//               `existing-${index}`
//             ),
//         })
//       );

//     payload.append(
//       "existingImages",
//       JSON.stringify(
//         updatedExisting
//       )
//     );
//   }


//   // =================================================
//   // New Images
//   // =================================================

//   if (
//     Array.isArray(
//       product.images
//     )
//   ) {
//     product.images.forEach(
//       (file) => {
//         payload.append(
//           "images",
//           file
//         );
//       }
//     );

//     payload.append(
//       "isMain",
//       product.mainIndex >= 0
//         ? product.mainIndex
//         : 0
//     );

//     payload.append(
//       "newMainIndex",
//       product.mainIndex ?? -1
//     );
//   }


//   return payload;
// }


// // =====================================================
// // Products Page
// // =====================================================

// export function ProductsPage({
//   products,
//   setProducts,
// }) {
//   const [query, setQuery] =
//     useState("");

//   const [status, setStatus] =
//     useState("All");

//   const [dialogOpen, setDialogOpen] =
//     useState(false);

//   const [editing, setEditing] =
//     useState(null);

//   const [loading, setLoading] =
//     useState(false);

//   const [saving, setSaving] =
//     useState(false);

//   const [error, setError] =
//     useState("");


//   // ===================================================
//   // Fetch Products
//   // ===================================================

//   const fetchProducts =
//     async () => {
//       setLoading(true);

//       setError("");

//       try {
//         const response =
//           await fetch(
//             ALL_PRODUCTS_URL
//           );

//         if (!response.ok) {
//           throw new Error(
//             "Failed to load products"
//           );
//         }

//         const data =
//           await response.json();

//         const productList =
//           data.allProduct ||
//           data.productData ||
//           data.data ||
//           [];

//         setProducts(
//           productList.map(
//             normalizeProduct
//           )
//         );
//       } catch (err) {
//         setError(
//           "Live API theke product load kora jayni. Demo data ekhono dekhacche."
//         );

//         console.error(err);
//       } finally {
//         setLoading(false);
//       }
//     };


//   // ===================================================
//   // Initial Load
//   // ===================================================

//   useEffect(() => {
//     fetchProducts();
//   }, []);


//   // ===================================================
//   // Filter Products
//   // ===================================================

//   const filtered =
//     useMemo(() => {
//       return products.filter(
//         (product) => {
//           const matchesQuery =
//             [
//               product.title,
//               product.sku,
//               product.category,
//             ]
//               .join(" ")
//               .toLowerCase()
//               .includes(
//                 query.toLowerCase()
//               );

//           const matchesStatus =
//             status === "All" ||
//             product.status ===
//               status;

//           return (
//             matchesQuery &&
//             matchesStatus
//           );
//         }
//       );
//     }, [
//       products,
//       query,
//       status,
//     ]);


//   // ===================================================
//   // Save Product
//   // ===================================================

//   const saveProduct =
//     async (product) => {
//       setSaving(true);

//       setError("");

//       try {
//         const response =
//           await fetch(
//             editing
//               ? updateProductUrl(
//                   product.id
//                 )
//               : CREATE_PRODUCT_URL,
//             {
//               method: "POST",

//               body:
//                 buildProductPayload(
//                   product
//                 ),
//             }
//           );

//         if (!response.ok) {
//           const errorData =
//             await response
//               .json()
//               .catch(() => null);

//           throw new Error(
//             errorData?.message ||
//               "Failed to save product"
//           );
//         }

//         // Reload products
//         await fetchProducts();

//         // Close dialog
//         setDialogOpen(false);

//         setEditing(null);
//       } catch (err) {
//         setError(
//           "Product save hoyni. Backend endpoint/auth/CORS check korte hobe."
//         );

//         console.error(err);
//       } finally {
//         setSaving(false);
//       }
//     };


//   // ===================================================
//   // Delete Product
//   // ===================================================

//   const deleteProduct =
//     async (id) => {
//       setError("");

//       try {
//         const response =
//           await fetch(
//             deleteProductUrl(id),
//             {
//               method: "DELETE",
//             }
//           );

//         if (!response.ok) {
//           throw new Error(
//             "Failed to delete product"
//           );
//         }

//         setProducts(
//           (current) =>
//             current.filter(
//               (product) =>
//                 product.id !== id
//             )
//         );
//       } catch (err) {
//         setError(
//           "Product delete hoyni. Backend endpoint/auth/CORS check korte hobe."
//         );

//         console.error(err);
//       }
//     };


//   // ===================================================
//   // Open Add Product
//   // ===================================================

//   const handleAddProduct =
//     () => {
//       setEditing(null);
//       setDialogOpen(true);
//     };


//   // ===================================================
//   // Open Edit Product
//   // ===================================================

//   const handleEditProduct =
//     (product) => {
//       setEditing(product);
//       setDialogOpen(true);
//     };


//   // ===================================================
//   // Close Dialog
//   // ===================================================

//   const handleCloseDialog =
//     () => {
//       setDialogOpen(false);
//       setEditing(null);
//     };


//   // ===================================================
//   // JSX
//   // ===================================================

//   return (
//     <div className="space-y-6">

//       {/* ============================================
//           Page Header
//       ============================================ */}

//       <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">

//         <div>
//           <h2 className="text-3xl font-bold tracking-normal">
//             Products
//           </h2>

//           <p className="mt-2 text-muted-foreground">
//             Add, edit, filter and manage E-Earbuds inventory.
//           </p>
//         </div>


//         <div className="flex flex-wrap gap-2">

//           <Button
//             variant="outline"
//             onClick={fetchProducts}
//             disabled={loading}
//           >
//             {loading
//               ? "Loading..."
//               : "Reload API"}
//           </Button>


//           <Button
//             onClick={
//               handleAddProduct
//             }
//           >
//             <Plus className="h-4 w-4" />

//             Add Product
//           </Button>

//         </div>

//       </div>


//       {/* ============================================
//           Error
//       ============================================ */}

//       {error && (
//         <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
//           {error}
//         </div>
//       )}


//       {/* ============================================
//           Product Management Card
//       ============================================ */}

//       <Card>

//         <CardHeader>

//           <CardTitle>
//             Product Management
//           </CardTitle>

//           <CardDescription>
//             {filtered.length} products
//             showing from{" "}
//             {products.length} total
//           </CardDescription>

//         </CardHeader>


//         <CardContent>

//           {/* ========================================
//               Search & Filter
//           ======================================== */}

//           <div className="mb-4 grid gap-3 md:grid-cols-[1fr_180px]">

//             <div className="relative">

//               <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

//               <Input
//                 className="pl-9"
//                 placeholder="Search product, SKU or category"
//                 value={query}
//                 onChange={(event) =>
//                   setQuery(
//                     event.target.value
//                   )
//                 }
//               />

//             </div>


//             <Select
//               value={status}
//               onChange={(event) =>
//                 setStatus(
//                   event.target.value
//                 )
//               }
//             >
//               <option>
//                 All
//               </option>

//               <option>
//                 Active
//               </option>

//               <option>
//                 Pending
//               </option>

//               <option>
//                 Low Stock
//               </option>

//               <option>
//                 Out of Stock
//               </option>

//               <option>
//                 Inactive
//               </option>
//             </Select>

//           </div>


//           {/* ========================================
//               Product Table
//           ======================================== */}

//           <Table>

//             <TableHeader>

//               <TableRow>

//                 <TableHead>
//                   Product
//                 </TableHead>

//                 <TableHead>
//                   SKU
//                 </TableHead>

//                 <TableHead>
//                   Main Price
//                 </TableHead>

//                 <TableHead>
//                   Discount Price
//                 </TableHead>

//                 <TableHead>
//                   Discount info
//                 </TableHead>

//                 <TableHead>
//                   Stock
//                 </TableHead>

//                 <TableHead>
//                   Status
//                 </TableHead>

//                 <TableHead className="text-right">
//                   Actions
//                 </TableHead>

//               </TableRow>

//             </TableHeader>


//             <TableBody>

//               {filtered.map(
//                 (product) => (

//                   <TableRow
//                     key={
//                       product.id
//                     }
//                   >

//                     {/* Product */}

//                     <TableCell className="min-w-[260px]">

//                       <div className="flex items-center gap-3">

//                         <img
//                           src={
//                             product.image
//                           }
//                           alt={
//                             product.title
//                           }
//                           className="h-12 w-12 rounded-md object-cover"
//                         />

//                         <div>

//                           <p className="font-semibold">
//                             {
//                               product.title
//                             }
//                           </p>

//                         </div>

//                       </div>

//                     </TableCell>


//                     {/* SKU */}

//                     <TableCell>
//                       {product.sku}
//                     </TableCell>


//                     {/* Main Price */}

//                     <TableCell>
//                       {formatCurrency(
//                         product.price
//                       )}
//                     </TableCell>


//                     {/* Discount Price */}

//                     <TableCell>

//                       <span className="font-semibold">
//                         {formatCurrency(
//                           product.discountPrice
//                         )}
//                       </span>

//                       {product.originalPrice >
//                         product.price && (
//                         <span className="ml-2 text-xs text-muted-foreground line-through">
//                           {formatCurrency(
//                             product.originalPrice
//                           )}
//                         </span>
//                       )}

//                     </TableCell>


//                     {/* Discount Info */}

//                     <TableCell
//                       className={
//                         product.price ===
//                         product.discountPrice
//                           ? "font-semibold text-red-400"
//                           : "font-semibold text-green-600"
//                       }
//                     >

//                       {product.price ===
//                       product.discountPrice
//                         ? "No discount"
//                         : product.discountType ===
//                           "flat"
//                         ? `Flat - ${product.discountValue}`
//                         : product.discountType ===
//                           "percentage"
//                         ? `${product.discountValue}% Discount`
//                         : "Discount"}

//                     </TableCell>


//                     {/* Stock */}

//                     <TableCell>
//                       {
//                         product.stock
//                       }
//                     </TableCell>


//                     {/* Status */}

//                     <TableCell>

//                       <StatusBadge
//                         status={
//                           product.status
//                         }
//                       />

//                     </TableCell>


//                     {/* Actions */}

//                     <TableCell>

//                       <div className="flex justify-end gap-2">

//                         {/* Edit */}

//                         <Button
//                           variant="outline"
//                           size="icon"
//                           onClick={() =>
//                             handleEditProduct(
//                               product
//                             )
//                           }
//                           aria-label="Edit product"
//                         >
//                           <Edit3 className="h-4 w-4" />
//                         </Button>


//                         {/* Delete */}

//                         <Button
//                           variant="ghost"
//                           size="icon"
//                           className="text-rose-600"
//                           onClick={() =>
//                             deleteProduct(
//                               product.id
//                             )
//                           }
//                           aria-label="Delete product"
//                         >
//                           <Trash2 className="h-4 w-4" />
//                         </Button>

//                       </div>

//                     </TableCell>

//                   </TableRow>

//                 )
//               )}

//             </TableBody>

//           </Table>

//         </CardContent>

//       </Card>


//       {/* ============================================
//           Product Dialog
//       ============================================ */}

//       <ProductDialog
//         open={dialogOpen}
//         product={editing}
//         onClose={
//           handleCloseDialog
//         }
//         onSave={saveProduct}
//         saving={saving}
//       />

//     </div>
//   );
// }




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

import { calculateDiscountPrice } from "@/lib/discount";
import { formatCurrency } from "@/lib/utils";

// =====================================================
// API
// =====================================================

const API_ORIGIN = "http://localhost:3000";

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
// Placeholder Image
// =====================================================

const placeholderImage =
  "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?auto=format&fit=crop&w=240&q=80";

// =====================================================
// Normalize Status
// =====================================================

function normalizeStatus(status, stock) {
  const value = String(
    status || "Active"
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
    product.image
  ) {
    return product.image;
  }

  const images = Array.isArray(product.images)
    ? product.images
    : [];

  const mainImage =
    images.find(
      (image) => image.isMain
    ) || images[0];

  const imageUrl =
    mainImage?.url ||
    mainImage?.secure_url ||
    mainImage;

  if (
    !imageUrl ||
    typeof imageUrl !== "string"
  ) {
    return placeholderImage;
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

  if (value <= 0) {
    return productPrice;
  }

  // Flat
  if (discountType === "flat") {
    return Math.max(
      productPrice - value,
      0
    );
  }

  // Percentage
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
// Normalize Product
// =====================================================

function normalizeProduct(product) {
  const stock = Number(
    product.stock ?? 0
  );

  const price = Number(
    product.price ?? 0
  );

  const rawDiscountPrice =
    Number(
      product.discountPrice ??
      product.price ??
      0
    );

  const discountType =
    normalizeDiscountType(
      product.discountType
    );

  const discountValue =
    product.discountValue ??
    (
      discountType === "flat" &&
      price > rawDiscountPrice
        ? price - rawDiscountPrice
        : discountType === "percentage" &&
          price > rawDiscountPrice
        ? Math.round(
            (
              (price - rawDiscountPrice) /
              price
            ) * 100
          )
        : ""
    );

  const discountPrice =
    calculateDiscountPrice({
      price,
      discountType,
      discountValue,
      discountStartDate:
        product.discountStartDate,
      discountEndDate:
        product.discountEndDate,
      fallbackDiscountPrice:
        rawDiscountPrice,
    });

  // ===================================================
  // IMPORTANT
  //
  // Keep all existing database images.
  // ProductDialog will use these while editing.
  // ===================================================

  const existingImages =
    Array.isArray(product.images)
      ? product.images.map(
          (image, index) => ({
            ...image,

            // Keep a stable fallback key
            _id:
              image._id ||
              `existing-${index}`,

            url: image.url,

            isMain:
              Boolean(image.isMain),
          })
        )
      : [];

  const mainImage =
    existingImages.find(
      (image) => image.isMain
    );

  return {
    id:
      product._id ||
      product.id ||
      `prd-${Date.now()}`,

    title:
      product.title ||
      "Untitled product",

    // SKU display only.
    // Backend will NOT update it.
    sku: product.sku,

    brand: product.brand,

    category:
      product.category,

    subCategory:
      product.subCategory,

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

    // =================================================
    // Features
    // =================================================

    features:
      Array.isArray(product.features)
        ? product.features
        : [],

    // =================================================
    // Specifications
    // =================================================

    specifications:
      Array.isArray(product.specifications)
        ? product.specifications
        : [],

    // =================================================
    // Price
    // =================================================

    price,

    originalPrice:
      Number(
        product.originalPrice ??
        product.price ??
        0
      ),

    discountPrice,

    discountType,

    discountValue:
      discountValue === undefined ||
      discountValue === null
        ? ""
        : String(discountValue),

    discountStartDate:
      product.discountStartDate || "",

    discountEndDate:
      product.discountEndDate || "",

    // =================================================
    // Inventory
    // =================================================

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

    // =================================================
    // Main Image
    // =================================================

    image:
      imageFromProduct(product),

    // =================================================
    // IMPORTANT
    //
    // Existing database images are retained here.
    // If user deletes one from ProductDialog,
    // this array will become smaller.
    // =================================================

    existingImages,

    mainKey:
      mainImage?._id ||
      (
        existingImages.length > 0
          ? `existing-0`
          : null
      ),

    // Raw backend product
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
// Build Product FormData
// =====================================================

function buildProductPayload(product) {
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

  // SKU sent for identification/create.
  // Backend update controller will NOT modify SKU.
  payload.append(
    "sku",
    product.sku || ""
  );

  payload.append(
    "stock",
    product.stock ?? 0
  );

  payload.append(
    "brand",
    product.brand || ""
  );

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
    backendStatus(product.status)
  );

  payload.append(
    "additionalInfo",
    product.additionalInfo || ""
  );

  // ===================================================
  // Features
  // ===================================================

  const cleanFeatures =
    Array.isArray(product.features)
      ? product.features
          .map((feature) =>
            String(feature).trim()
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
    JSON.stringify(cleanFeatures)
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

  // ===================================================
  // No Discount
  // ===================================================

  if (
    discountType === "none"
  ) {
    payload.append(
      "discountValue",
      "0"
    );

    payload.append(
      "discountPrice",
      product.price ?? 0
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

  // ===================================================
  // Flat / Percentage
  // ===================================================

  else {
    const discountValue =
      Number(
        product.discountValue || 0
      );

    const finalDiscountPrice =
      calculateFinalDiscountPrice({
        price: product.price,
        discountType,
        discountValue,
      });

    payload.append(
      "discountValue",
      discountValue
    );

    payload.append(
      "discountPrice",
      finalDiscountPrice
    );

    payload.append(
      "discountStartDate",
      product.discountStartDate || ""
    );

    payload.append(
      "discountEndDate",
      product.discountEndDate || ""
    );
  }

  // ===================================================
  // EXISTING IMAGES
  // ===================================================
  //
  // VERY IMPORTANT:
  //
  // existingImages contains ONLY images that user wants
  // to KEEP.
  //
  // If ProductDialog removes an old image, it will not
  // exist in this array.
  //
  // Backend will therefore remove it from MongoDB.
  // ===================================================

  if (
    Array.isArray(product.existingImages)
  ) {
    const updatedExisting =
      product.existingImages.map(
        (image, index) => ({
          ...(image._id
            ? {
                _id: image._id,
              }
            : {}),

          url: image.url,

          isMain:
            product.mainKey ===
            (
              image._id ||
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
  // NEW IMAGES
  // ===================================================

  if (
    Array.isArray(product.images)
  ) {
    product.images.forEach(
      (file) => {
        // Only actual File objects
        // should be uploaded.
        if (file instanceof File) {
          payload.append(
            "images",
            file
          );
        }
      }
    );

    // New image main index
    payload.append(
      "newMainIndex",
      product.mainIndex >= 0
        ? product.mainIndex
        : -1
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

  const [error, setError] =
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
        setError(
          "Live API theke product load kora jayni."
        );

        console.error(err);
      } finally {
        setLoading(false);
      }
    };

  // ===================================================
  // Initial Load
  // ===================================================

  useEffect(() => {
    fetchProducts();
  }, []);

  // ===================================================
  // Filter
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
  // ===================================================

  const saveProduct =
    async (product) => {
      setSaving(true);
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
          await fetch(url, {
            method: "POST",
            body:
              buildProductPayload(
                product
              ),
          });

        const errorData =
          await response
            .json()
            .catch(() => null);

        if (!response.ok) {
          throw new Error(
            errorData?.message ||
              "Failed to save product"
          );
        }

        // Reload latest data
        await fetchProducts();

        // Close dialog
        setDialogOpen(false);
        setEditing(null);

      } catch (err) {
        setError(
          err.message ||
            "Product save hoyni."
        );

        console.error(err);
      } finally {
        setSaving(false);
      }
    };

  // ===================================================
  // Delete Product
  // ===================================================

  const deleteProduct =
    async (id) => {
      setError("");

      try {
        const response =
          await fetch(
            deleteProductUrl(id),
            {
              method: "DELETE",
            }
          );

        if (!response.ok) {
          throw new Error(
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
        setError(
          "Product delete hoyni. Backend endpoint/auth/CORS check korte hobe."
        );

        console.error(err);
      }
    };

  const handleAddProduct =
    () => {
      setEditing(null);
      setDialogOpen(true);
    };

  const handleEditProduct =
    (product) => {
      setEditing(product);
      setDialogOpen(true);
    };

  const handleCloseDialog =
    () => {
      setDialogOpen(false);
      setEditing(null);
    };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">

        <div>
          <h2 className="text-3xl font-bold tracking-normal">
            Products
          </h2>

          <p className="mt-2 text-muted-foreground">
            Add, edit, filter and manage E-Earbuds inventory.
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
      {error && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error}
        </div>
      )}
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
                  Discount info
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

              {filtered.map(
                (product) => (

                  <TableRow
                    key={
                      product.id
                    }
                  >

                    {/* Product */}

                    <TableCell className="min-w-[260px]">

                      <div className="flex items-center gap-3">

                        <img
                          src={
                            product.image
                          }
                          alt={
                            product.title
                          }
                          className="h-12 w-12 rounded-md object-cover"
                        />

                        <div>
                          <p className="font-semibold">
                            {
                              product.title
                            }
                          </p>
                        </div>

                      </div>

                    </TableCell>

                    {/* SKU */}

                    <TableCell>
                      {
                        product.sku
                      }
                    </TableCell>

                    {/* Main Price */}

                    <TableCell>
                      {formatCurrency(
                        product.price
                      )}
                    </TableCell>

                    {/* Discount Price */}

                    <TableCell>

                      <span className="font-semibold">
                        {formatCurrency(
                          product.discountPrice
                        )}
                      </span>

                      {product.originalPrice >
                        product.price && (
                        <span className="ml-2 text-xs text-muted-foreground line-through">
                          {formatCurrency(
                            product.originalPrice
                          )}
                        </span>
                      )}

                    </TableCell>

                    {/* Discount Info */}

                    <TableCell
                      className={
                        product.price ===
                        product.discountPrice
                          ? "font-semibold text-red-400"
                          : "font-semibold text-green-600"
                      }
                    >

                      {product.price ===
                      product.discountPrice
                        ? "No discount"
                        : product.discountType ===
                          "flat"
                        ? `Flat - ${product.discountValue}`
                        : product.discountType ===
                          "percentage"
                        ? `${product.discountValue}% Discount`
                        : "Discount"}

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
                )
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <ProductDialog
        open={dialogOpen}
        product={editing}
        onClose={
          handleCloseDialog
        }
        onSave={saveProduct}
        saving={saving}
      />

    </div>
  );
}