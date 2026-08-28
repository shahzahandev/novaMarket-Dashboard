import { ImagePlus, Plus, Save, Star, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/input";
import { calculateDiscountPrice } from "@/lib/discount";

const MAX_IMAGES = 5;
const API_ORIGIN = "https://nova-market-dashboard.vercel.app";

const emptyProduct = {
  title: "",
  description: "",
  shortDescription: "",
  price: "",
  stock: "",
  brand: "E-Earbuds",
  category: "",
  subCategory: "",
  tag: "",
  features: "",
  status: "",
  additionalInfo: "",
  discountType: "none",
  discountValue: "",
  discountStartDate: "",
  discountEndDate: "",
  discountPrice: "",
  existingImages: [],
};

function toDateInputValue(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function imageSrc(image) {
  if (!image) return "";

  if (typeof image === "string") return image;

  const url = image.url || image.secure_url || "";

  return url.startsWith("http") ? url : `${API_ORIGIN}${url}`;
}

function normalizeDiscountType(type) {
  const value = String(type || "none").toLowerCase();

  return ["flat", "percentage", "none"].includes(value)
    ? value
    : "none";
}

function getDiscountValue(product) {
  const type = normalizeDiscountType(
    product?.raw?.discountType || product?.discountType
  );

  const rawValue =
    product?.raw?.discountValue ?? product?.discountValue;

  if (
    rawValue !== undefined &&
    rawValue !== null &&
    rawValue !== ""
  ) {
    return String(rawValue);
  }

  if (type === "none") return "";

  const price = Number(
    product?.raw?.price ?? product?.price ?? 0
  );

  const discountPrice = Number(
    product?.raw?.discountPrice ??
      product?.discountPrice ??
      price
  );

  if (!price || discountPrice >= price) return "";

  if (type === "flat") {
    return String(price - discountPrice);
  }

  if (type === "percentage") {
    return String(
      Math.round(((price - discountPrice) / price) * 100)
    );
  }

  return "";
}

export function ProductDialog({
  open,
  product,
  onClose,
  onSave,
  saving = false,
}) {
  const [form, setForm] = useState(emptyProduct);

  const [specifications, setSpecifications] = useState([
    { name: "", value: "" },
  ]);

  const [newImages, setNewImages] = useState([]);
  const [newPreviews, setNewPreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);

  const [mainKey, setMainKey] = useState(null);

  const [imageError, setImageError] = useState("");
  const [formError, setFormError] = useState("");

  // ---------------------------------------
  // Category States
  // ---------------------------------------

  const [categories, setCategories] = useState([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categoryCreating, setCategoryCreating] = useState(false);
  const [categoryError, setCategoryError] = useState("");

  const [showCategoryOptions, setShowCategoryOptions] =
    useState(false);

  // ---------------------------------------
  // Fetch All Categories
  // ---------------------------------------

  const fetchCategories = async () => {
    try {
      setCategoryLoading(true);
      setCategoryError("");

      const response = await axios.get(
        `${API_ORIGIN}/api/v1/product/allCategory`
      );

      if (response.data?.success) {
        const allCategory = response.data?.allCategory || [];
        setCategories(allCategory);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.log("Category fetch error:", error);

      setCategoryError("Failed to load categories.");
    } finally {
      setCategoryLoading(false);
    }
  };

  // Fetch Category When Dialog Opens
  useEffect(() => {
    if (open) {
      fetchCategories();
    }
  }, [open]);

  // ---------------------------------------
  // Product Data
  // ---------------------------------------

  useEffect(() => {
    const existing =
      product?.raw?.images ||
      product?.existingImages ||
      [];

    const mainExisting =
      existing.find((image) => image.isMain) ||
      existing[0];

    const discountType = normalizeDiscountType(
      product?.raw?.discountType ||
        product?.discountType
    );

    const rawFeatures =
      product?.raw?.features ||
      product?.features;

    const rawSpecs =
      product?.raw?.specifications ||
      product?.specifications;

    setForm({
      ...emptyProduct,
      ...product,

      status:
        product?.raw?.status ||
        product?.status?.toLowerCase?.() ||
        "",

      discountType,

      discountValue: getDiscountValue(product),

      discountStartDate: toDateInputValue(
        product?.raw?.discountStartDate ||
          product?.discountStartDate
      ),

      discountEndDate: toDateInputValue(
        product?.raw?.discountEndDate ||
          product?.discountEndDate
      ),

      features: Array.isArray(rawFeatures)
        ? rawFeatures.join(", ")
        : rawFeatures || "",
    });

    setSpecifications(
      Array.isArray(rawSpecs) && rawSpecs.length
        ? rawSpecs.map((s) => ({
            name: s.name || "",
            value: s.value || "",
          }))
        : [{ name: "", value: "" }]
    );

    setExistingImages(existing);

    setNewImages([]);
    setNewPreviews([]);

    setMainKey(
      mainExisting?._id ||
        (existing.length ? "existing-0" : null)
    );

    setImageError("");
    setFormError("");
    setCategoryError("");
  }, [product, open]);

  // ---------------------------------------
  // Discount Price
  // ---------------------------------------

  const salePrice = useMemo(() => {
    return calculateDiscountPrice({
      price: form.price,
      discountType: form.discountType,
      discountValue: form.discountValue,
      discountStartDate: form.discountStartDate,
      discountEndDate: form.discountEndDate,
      fallbackDiscountPrice: form.discountPrice,
    });
  }, [
    form.discountEndDate,
    form.discountPrice,
    form.discountStartDate,
    form.discountType,
    form.discountValue,
    form.price,
  ]);

  if (!open) return null;

  const totalImageCount =
    existingImages.length + newImages.length;

  const update = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  // ---------------------------------------
  // Category Helpers
  // ---------------------------------------

  const normalizedCategoryInput =
    String(form.category || "")
      .trim()
      .toLowerCase();

  const filteredCategories = categories.filter(
    (category) => {
      const categoryName = String(
        category?.name || category
      );

      return categoryName
        .toLowerCase()
        .includes(normalizedCategoryInput);
    }
  );

  const exactCategoryExists = categories.some(
    (category) => {
      const categoryName = String(
        category?.name || category
      )
        .trim()
        .toLowerCase();

      return (
        categoryName === normalizedCategoryInput
      );
    }
  );

  // ---------------------------------------
  // Create New Category
  // ---------------------------------------

  const createNewCategory = async () => {
    const categoryName = String(form.category || "").trim();

    if (!categoryName) {
      setCategoryError("Please enter a category name.");
      return;
    }

    if (exactCategoryExists) {
      const existingCategory = categories.find(
        (category) => {
          const name = String(
            category?.name || category
          )
            .trim()
            .toLowerCase();

          return (
            name === categoryName.toLowerCase()
          );
        }
      );

      update(
        "category",
        existingCategory?.name || categoryName
      );

      setShowCategoryOptions(false);
      setCategoryError("");

      return;
    }

    try {
      setCategoryCreating(true);
      setCategoryError("");

      const response = await axios.post(
        `${API_ORIGIN}/api/v1/product/createCategory`,
        {
          name: categoryName,
        }
      );

      if (!response.data?.success) {
        setCategoryError(
          response.data?.message ||
            "Failed to create category."
        );

        return;
      }

      const newCategory =
        response.data?.category ||
        response.data?.newCategory ||
        response.data?.createdCategory;

      // ---------------------------------------
      // Get Created Category Name
      // ---------------------------------------

      const createdCategory =
        newCategory?.name ||
        newCategory ||
        categoryName;

      // Add new category to list
      setCategories((current) => {
        const alreadyExists = current.some(
          (category) => {
            const name = String(
              category?.name || category
            )
              .trim()
              .toLowerCase();

            return (
              name ===
              String(createdCategory)
                .trim()
                .toLowerCase()
            );
          }
        );

        if (alreadyExists) {
          return current;
        }

        return [
          ...current,
          newCategory || {
            name: createdCategory,
          },
        ];
      });

      // Select newly created category
      update("category", createdCategory);

      setShowCategoryOptions(false);
      setCategoryError("");
    } catch (error) {
      console.log(
        "Create category error:",
        error
      );

      setCategoryError(
        error.response?.data?.message ||
          "Failed to create category."
      );
    } finally {
      setCategoryCreating(false);
    }
  };

  // ---------------------------------------
  // Specification
  // ---------------------------------------

  const updateSpec = (
    index,
    field,
    value
  ) => {
    setSpecifications((prev) =>
      prev.map((s, i) =>
        i === index
          ? {
              ...s,
              [field]: value,
            }
          : s
      )
    );
  };

  const addSpecRow = () => {
    setSpecifications((prev) => [
      ...prev,
      {
        name: "",
        value: "",
      },
    ]);
  };

  const removeSpecRow = (index) => {
    setSpecifications((prev) =>
      prev.filter(
        (_, i) => i !== index
      )
    );
  };

  // ---------------------------------------
  // Images
  // ---------------------------------------

  const addImages = (event) => {
    const files = Array.from(
      event.target.files || []
    );

    if (!files.length) return;

    setImageError("");

    const remainingSlots =
      MAX_IMAGES - totalImageCount;

    if (remainingSlots <= 0) {
      setImageError(
        `You can upload a maximum of ${MAX_IMAGES} images.`
      );

      event.target.value = "";

      return;
    }

    const filesToAdd = files.slice(
      0,
      remainingSlots
    );

    const startIndex = newImages.length;

    if (files.length > remainingSlots) {
      setImageError(
        `Only first ${remainingSlots} image(s) added. Maximum limit is ${MAX_IMAGES}.`
      );
    }

    setNewImages((current) => [
      ...current,
      ...filesToAdd,
    ]);

    setNewPreviews((current) => [
      ...current,
      ...filesToAdd.map((file) =>
        URL.createObjectURL(file)
      ),
    ]);

    setMainKey(
      (current) =>
        current || `new-${startIndex}`
    );

    event.target.value = "";
  };

  const removeExistingImage = (index) => {
    const removed =
      existingImages[index];

    const updated =
      existingImages.filter(
        (_, currentIndex) =>
          currentIndex !== index
      );

    setExistingImages(updated);

    setMainKey((current) => {
      const removedKey =
        removed?._id ||
        `existing-${index}`;

      if (current !== removedKey) {
        return current;
      }

      return (
        updated[0]?._id ||
        (updated.length
          ? "existing-0"
          : newImages.length
          ? "new-0"
          : null)
      );
    });
  };

  const removeNewImage = (index) => {
    setNewImages((current) =>
      current.filter(
        (_, currentIndex) =>
          currentIndex !== index
      )
    );

    setNewPreviews((current) =>
      current.filter(
        (_, currentIndex) =>
          currentIndex !== index
      )
    );

    setMainKey((current) => {
      if (current === `new-${index}`) {
        return (
          existingImages[0]?._id ||
          (existingImages.length
            ? "existing-0"
            : newImages.length > 1
            ? "new-0"
            : null)
        );
      }

      if (
        typeof current === "string" &&
        current.startsWith("new-")
      ) {
        const currentIndex = Number(
          current.split("-")[1]
        );

        if (currentIndex > index) {
          return `new-${currentIndex - 1}`;
        }
      }

      return current;
    });
  };

  // ---------------------------------------
  // Submit Product
  // ---------------------------------------

  const submit = (event) => {
    event.preventDefault();

    setFormError("");

    if (
      !form.title ||
      !form.price ||
      !form.category
    ) {
      setFormError(
        "Title, Price, and Category are required."
      );

      return;
    }

    if (!form.status) {
      setFormError(
        "Status must be selected."
      );

      return;
    }

    if (
      form.discountType !== "none" &&
      form.discountStartDate &&
      form.discountEndDate &&
      form.discountStartDate >
        form.discountEndDate
    ) {
      setFormError(
        "Discount start date cannot be after the end date."
      );

      return;
    }

    if (
      form.discountType === "flat" &&
      Number(form.discountValue) >=
        Number(form.price)
    ) {
      setFormError(
        "Discount amount cannot be greater than or equal to product price."
      );

      return;
    }

    if (
      form.discountType === "percentage" &&
      Number(form.discountValue) > 100
    ) {
      setFormError(
        "Percentage discount cannot be greater than 100%."
      );

      return;
    }

    const cleanSpecs =
      specifications
        .map((s) => ({
          name: s.name.trim(),
          value: s.value.trim(),
        }))
        .filter(
          (s) => s.name && s.value
        );

    const cleanFeatures =
      form.features
        ? form.features
            .split(",")
            .map((feature) =>
              feature.trim()
            )
            .filter(Boolean)
        : [];

    onSave({
      ...form,

      id:
        form.id ||
        `prd-${Date.now()}`,

      price: Number(form.price),

      stock: Number(
        form.stock || 0
      ),

      discountPrice: salePrice,

      specifications: cleanSpecs,

      features: cleanFeatures,

      images: newImages,

      existingImages,

      mainKey,

      mainIndex:
        typeof mainKey === "string" &&
        mainKey.startsWith("new-")
          ? Number(
              mainKey.split("-")[1]
            )
          : -1,
    });
  };

  // ---------------------------------------
  // JSX
  // ---------------------------------------

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/45 p-4">
      <div className="mx-auto my-6 w-full max-w-4xl">
        <Card className="shadow-soft">

          {/* Header */}
          <CardHeader className="flex-row items-start justify-between gap-4 border-b">
            <div>
              <CardTitle className="text-3xl">
                {product
                  ? "Update Product"
                  : "Add Product"}
              </CardTitle>

              <p className="mt-1 text-sm text-muted-foreground">
                {product
                  ? "Edit this product's details."
                  : "Create a new product listing."}
              </p>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Close product form"
            >
              <X className="h-5 w-5" />
            </Button>
          </CardHeader>

          <CardContent className="p-6 sm:p-8">

            <form
              onSubmit={submit}
              className="grid grid-cols-1 gap-5 sm:grid-cols-2"
            >

              {/* Title */}
              <Field
                label="Title"
                required
                className="sm:col-span-2"
              >
                <Input
                  value={form.title}
                  onChange={(event) =>
                    update(
                      "title",
                      event.target.value
                    )
                  }
                  placeholder="Product title"
                />
              </Field>

              {/* Description */}
              <Field
                label="Description"
                className="sm:col-span-2"
              >
                <Textarea
                  rows={4}
                  value={form.description}
                  onChange={(event) =>
                    update(
                      "description",
                      event.target.value
                    )
                  }
                  placeholder="Full product description"
                />
              </Field>

              {/* Short Description */}
              <Field
                label="Short Description"
                className="sm:col-span-2"
              >
                <Textarea
                  rows={2}
                  value={
                    form.shortDescription
                  }
                  onChange={(event) =>
                    update(
                      "shortDescription",
                      event.target.value
                    )
                  }
                  placeholder="One or two lines summary"
                />
              </Field>

              {/* Price */}
              <Field
                label="Price"
                required
              >
                <Input
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={(event) =>
                    update(
                      "price",
                      event.target.value
                    )
                  }
                  placeholder="0"
                />
              </Field>

              {/* Stock */}
              <Field label="Stock">
                <Input
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(event) =>
                    update(
                      "stock",
                      event.target.value
                    )
                  }
                  placeholder="0"
                />
              </Field>

              {/* Brand */}
              <Field label="Brand">
                <Input
                  value={form.brand}
                  onChange={(event) =>
                    update(
                      "brand",
                      event.target.value
                    )
                  }
                  placeholder="Brand name"
                />
              </Field>

              {/* ============================
                  CATEGORY
              ============================ */}

              <Field
                label="Category"
                required
              >
                <div className="relative">

                  <Input
                    value={form.category}
                    onFocus={() =>
                      setShowCategoryOptions(
                        true
                      )
                    }
                    onChange={(event) => {
                      update(
                        "category",
                        event.target.value
                      );

                      setShowCategoryOptions(
                        true
                      );

                      setCategoryError("");
                    }}
                    placeholder="Type or select category"
                    autoComplete="off"
                  />

                  {/* Category Dropdown */}
                  {showCategoryOptions && (
                    <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-md border bg-white shadow-lg">

                      {/* Loading */}
                      {categoryLoading && (
                        <div className="px-3 py-3 text-sm text-muted-foreground">
                          Loading categories...
                        </div>
                      )}

                      {/* Categories */}
                      {!categoryLoading &&
                        filteredCategories.length >
                          0 && (
                          <div className="p-1">

                            {filteredCategories.map(
                              (category) => {
                                const categoryName =
                                  category?.name ||
                                  category;

                                return (
                                  <button
                                    key={
                                      category?._id ||
                                      categoryName
                                    }
                                    type="button"
                                    onClick={() => {
                                      update(
                                        "category",
                                        categoryName
                                      );

                                      setShowCategoryOptions(
                                        false
                                      );

                                      setCategoryError(
                                        ""
                                      );
                                    }}
                                    className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-slate-100"
                                  >
                                    {categoryName}
                                  </button>
                                );
                              }
                            )}

                          </div>
                        )}

                      {/* No Matching Category */}
                      {!categoryLoading &&
                        normalizedCategoryInput &&
                        !exactCategoryExists && (
                          <div className="border-t p-2">

                            <button
                              type="button"
                              onClick={
                                createNewCategory
                              }
                              disabled={
                                categoryCreating
                              }
                              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-primary hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Plus className="h-4 w-4" />

                              {categoryCreating
                                ? "Creating..."
                                : `Create "${form.category.trim()}"`}
                            </button>

                          </div>
                        )}

                      {/* Empty */}
                      {!categoryLoading &&
                        !normalizedCategoryInput &&
                        filteredCategories.length ===
                          0 && (
                          <div className="px-3 py-3 text-sm text-muted-foreground">
                            No categories found.
                          </div>
                        )}

                    </div>
                  )}

                  {/* Category Error */}
                  {categoryError && (
                    <p className="mt-1 text-xs text-red-600">
                      {categoryError}
                    </p>
                  )}

                  {/* Click Outside */}
                  {showCategoryOptions && (
                    <div
                      className="fixed inset-0 z-[-1]"
                      onClick={() =>
                        setShowCategoryOptions(
                          false
                        )
                      }
                    />
                  )}

                </div>
              </Field>

              {/* Sub Category */}
              <Field label="Sub Category">
                <Input
                  value={form.subCategory}
                  onChange={(event) =>
                    update(
                      "subCategory",
                      event.target.value
                    )
                  }
                  placeholder="e.g. Earbuds"
                />
              </Field>

              {/* Tags */}
              <Field label="Tags">
                <Input
                  value={form.tag}
                  onChange={(event) =>
                    update(
                      "tag",
                      event.target.value
                    )
                  }
                  placeholder="wireless, anc, laptop"
                />
              </Field>

              {/* Status */}
              <Field
                label="Status"
                required
              >
                <Select
                  value={form.status}
                  onChange={(event) =>
                    update(
                      "status",
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    Select Status
                  </option>

                  <option value="pending">
                    pending
                  </option>

                  <option value="active">
                    active
                  </option>

                  <option value="inactive">
                    inactive
                  </option>
                </Select>
              </Field>

              {/* Features */}
              <Field
                label="Features"
                className="sm:col-span-2"
              >
                <Input
                  value={form.features}
                  onChange={(event) =>
                    update(
                      "features",
                      event.target.value
                    )
                  }
                  placeholder="GPS, Bluetooth, Voice Commands, IP68"
                />
              </Field>

              {/* Additional Info */}
              <Field
                label="Additional Information"
                className="sm:col-span-2"
              >
                <Textarea
                  rows={3}
                  value={
                    form.additionalInfo
                  }
                  onChange={(event) =>
                    update(
                      "additionalInfo",
                      event.target.value
                    )
                  }
                  placeholder="Box contents, warranty, notes..."
                />
              </Field>

              {/* ============================
                  SPECIFICATIONS
              ============================ */}

              <div className="sm:col-span-2 rounded-lg border p-5">

                <div className="mb-4 flex items-center justify-between">

                  <h3 className="text-base font-semibold">
                    Specifications
                  </h3>

                  <button
                    type="button"
                    onClick={addSpecRow}
                    className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    <Plus className="h-4 w-4" />
                    Add row
                  </button>

                </div>

                <div className="flex flex-col gap-3">

                  {specifications.map(
                    (spec, index) => (
                      <div
                        key={index}
                        className="flex flex-col gap-3 sm:flex-row"
                      >

                        <Input
                          value={spec.name}
                          onChange={(event) =>
                            updateSpec(
                              index,
                              "name",
                              event.target.value
                            )
                          }
                          placeholder="Battery Life"
                          className="flex-1"
                        />

                        <Input
                          value={spec.value}
                          onChange={(event) =>
                            updateSpec(
                              index,
                              "value",
                              event.target.value
                            )
                          }
                          placeholder="Up to 2 days"
                          className="flex-1"
                        />

                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            removeSpecRow(
                              index
                            )
                          }
                          disabled={
                            specifications.length ===
                            1
                          }
                          aria-label="Remove specification"
                          className="text-rose-600 sm:w-11"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>

                      </div>
                    )
                  )}

                </div>
              </div>

              {/* ============================
                  DISCOUNT
              ============================ */}

              <div className="sm:col-span-2 rounded-lg border p-5">

                <h3 className="mb-4 text-base font-semibold">
                  Discount
                </h3>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">

                  <Field label="Discount Type">
                    <Select
                      value={
                        form.discountType
                      }
                      onChange={(event) =>
                        update(
                          "discountType",
                          event.target.value
                        )
                      }
                    >
                      <option value="none">
                        None
                      </option>

                      <option value="flat">
                        Flat
                      </option>

                      <option value="percentage">
                        Percentage
                      </option>
                    </Select>
                  </Field>

                  <Field
                    label={`Discount ${
                      form.discountType ===
                      "percentage"
                        ? "(%)"
                        : "(BDT)"
                    }`}
                  >
                    <Input
                      type="number"
                      min="0"
                      value={
                        form.discountValue
                      }
                      onChange={(event) =>
                        update(
                          "discountValue",
                          event.target.value
                        )
                      }
                      disabled={
                        form.discountType ===
                        "none"
                      }
                      placeholder="0"
                    />
                  </Field>

                  <Field label="Sale price preview">
                    <div className="flex h-10 items-center rounded-md bg-muted px-3 text-sm font-semibold">
                      ৳
                      {salePrice.toLocaleString(
                        "en-US"
                      )}
                    </div>
                  </Field>

                  <Field label="Discount start date">
                    <Input
                      type="date"
                      value={
                        form.discountStartDate
                      }
                      onChange={(event) =>
                        update(
                          "discountStartDate",
                          event.target.value
                        )
                      }
                      disabled={
                        form.discountType ===
                        "none"
                      }
                    />
                  </Field>

                  <Field label="Discount end date">
                    <Input
                      type="date"
                      value={
                        form.discountEndDate
                      }
                      onChange={(event) =>
                        update(
                          "discountEndDate",
                          event.target.value
                        )
                      }
                      disabled={
                        form.discountType ===
                        "none"
                      }
                    />
                  </Field>

                </div>
              </div>

              {/* ============================
                  PRODUCT IMAGES
              ============================ */}

              <div className="sm:col-span-2">

                <div className="mb-2 flex items-center justify-between">

                  <label className="block text-sm font-medium">
                    Product Images
                  </label>

                  <span className="text-xs text-muted-foreground">
                    {totalImageCount}/
                    {MAX_IMAGES}
                  </span>

                </div>

                {/* Existing */}
                {existingImages.length >
                  0 && (
                  <>
                    <p className="mb-2 text-xs font-medium text-muted-foreground">
                      Current images
                    </p>

                    <ImageGrid
                      images={existingImages.map(
                        (image) =>
                          imageSrc(image)
                      )}
                      mainKey={mainKey}
                      keyPrefix="existing"
                      getKey={(index) =>
                        existingImages[
                          index
                        ]?._id ||
                        `existing-${index}`
                      }
                      onMain={(key) =>
                        setMainKey(key)
                      }
                      onRemove={
                        removeExistingImage
                      }
                    />
                  </>
                )}

                {/* Upload */}
                <label className="mt-3 flex h-32 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed text-muted-foreground transition hover:border-primary hover:text-primary">

                  <ImagePlus className="h-6 w-6" />

                  <span className="text-sm">
                    {totalImageCount >=
                    MAX_IMAGES
                      ? "Maximum images reached"
                      : "Click to upload images"}
                  </span>

                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={addImages}
                    disabled={
                      totalImageCount >=
                      MAX_IMAGES
                    }
                    className="hidden"
                  />

                </label>

                {imageError && (
                  <p className="mt-2 text-sm text-red-600">
                    {imageError}
                  </p>
                )}

                {/* New Images */}
                {newPreviews.length >
                  0 && (
                  <>
                    <p className="mb-2 mt-4 text-xs font-medium text-muted-foreground">
                      New images
                    </p>

                    <ImageGrid
                      images={newPreviews}
                      mainKey={mainKey}
                      keyPrefix="new"
                      getKey={(index) =>
                        `new-${index}`
                      }
                      onMain={(key) =>
                        setMainKey(key)
                      }
                      onRemove={
                        removeNewImage
                      }
                    />
                  </>
                )}

              </div>

              {/* Form Error */}
              {formError && (
                <div className="sm:col-span-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {formError}
                </div>
              )}

              {/* Buttons */}
              <div className="flex justify-end gap-2 sm:col-span-2">

                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={saving}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={saving}
                >
                  <Save className="h-4 w-4" />

                  {saving
                    ? "Saving..."
                    : product
                    ? "Update Product"
                    : "Submit"}
                </Button>

              </div>

            </form>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ===========================================
// Field Component
// ===========================================

function Field({
  label,
  required,
  className = "",
  children,
}) {
  return (
    <label
      className={`block ${className}`}
    >
      <span className="mb-2 block text-sm font-medium">
        {label}{" "}
        {required && (
          <span className="text-red-500">
            *
          </span>
        )}
      </span>

      {children}
    </label>
  );
}

// Image Grid

function ImageGrid({
  images,
  mainKey,
  getKey,
  onMain,
  onRemove,
}) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">

      {images.map((src, index) => {
        const key = getKey(index);

        const active =
          mainKey === key;

        return (
          <div
            key={`${key}-${src}`}
            className={`group relative aspect-square overflow-hidden rounded-lg border-2 ${
              active
                ? "border-primary"
                : "border-border"
            }`}
          >

            <img
              src={src}
              alt={`Product preview ${
                index + 1
              }`}
              className="h-full w-full object-cover"
            />

            {/* Main */}
            <button
              type="button"
              onClick={() =>
                onMain(key)
              }
              className={`absolute left-1 top-1 flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold transition ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-black/60 text-white opacity-0 group-hover:opacity-100"
              }`}
            >
              <Star
                className="h-2.5 w-2.5"
                fill={
                  active
                    ? "currentColor"
                    : "none"
                }
              />

              {active
                ? "Main"
                : "Set main"}
            </button>

            {/* Remove */}
            <button
              type="button"
              onClick={() =>
                onRemove(index)
              }
              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition group-hover:opacity-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>

          </div>
        );
      })}

    </div>
  );
}
