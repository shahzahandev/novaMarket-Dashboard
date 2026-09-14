import {
  ImagePlus,
  Plus,
  Save,
  Star,
  Trash2,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import axios from "axios";

import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Input,
  Select,
  Textarea,
} from "@/components/ui/input";

import {
  calculateDiscountPrice,
} from "@/lib/discount";

const MAX_IMAGES = 5;

const API_ORIGIN =
  "https://nova-market-backend-2.onrender.com";

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

// ===========================================
// DATE
// ===========================================

function toDateInputValue(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

// ===========================================
// IMAGE URL
// ===========================================

function imageSrc(image) {
  if (!image) return "";

  if (typeof image === "string") {
    return image;
  }

  const url =
    image.url ||
    image.secure_url ||
    "";

  if (!url) return "";

  return url.startsWith("http")
    ? url
    : `${API_ORIGIN}${url}`;
}

// ===========================================
// DISCOUNT TYPE
// ===========================================

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

// ===========================================
// DISCOUNT VALUE
// ===========================================

function getDiscountValue(product) {
  const type =
    normalizeDiscountType(
      product?.raw?.discountType ||
        product?.discountType
    );

  const rawValue =
    product?.raw?.discountValue ??
    product?.discountValue;

  if (
    rawValue !== undefined &&
    rawValue !== null &&
    rawValue !== ""
  ) {
    return String(rawValue);
  }

  if (type === "none") {
    return "";
  }

  const price = Number(
    product?.raw?.price ??
      product?.price ??
      0
  );

  const discountPrice = Number(
    product?.raw?.discountPrice ??
      product?.discountPrice ??
      price
  );

  if (
    !price ||
    discountPrice >= price
  ) {
    return "";
  }

  if (type === "flat") {
    return String(
      price - discountPrice
    );
  }

  if (type === "percentage") {
    return String(
      Math.round(
        ((price - discountPrice) /
          price) *
          100
      )
    );
  }

  return "";
}

// ===========================================
// PRODUCT DIALOG
// ===========================================

export function ProductDialog({
  open,
  product,
  onClose,
  onSave,
  saving = false,
}) {
  const [form, setForm] =
    useState(emptyProduct);

  const [specifications, setSpecifications] =
    useState([
      {
        name: "",
        value: "",
      },
    ]);

  const [newImages, setNewImages] =
    useState([]);

  const [newPreviews, setNewPreviews] =
    useState([]);

  const [existingImages, setExistingImages] =
    useState([]);

  // =========================================
  // MAIN IMAGE KEY
  // =========================================

  const [mainKey, setMainKey] =
    useState(null);

  const [imageError, setImageError] =
    useState("");

  const [formError, setFormError] =
    useState("");

  // =========================================
  // CATEGORY
  // =========================================

  const [categories, setCategories] =
    useState([]);

  const [categoryLoading, setCategoryLoading] =
    useState(false);

  const [categoryCreating, setCategoryCreating] =
    useState(false);

  const [categoryError, setCategoryError] =
    useState("");

  const [
    showCategoryOptions,
    setShowCategoryOptions,
  ] = useState(false);

  // =========================================
  // FETCH CATEGORIES
  // =========================================

  const fetchCategories = async () => {
    try {
      setCategoryLoading(true);
      setCategoryError("");

      const response =
        await axios.get(
          `${API_ORIGIN}/api/v1/product/allCategory`
        );

      if (response.data?.success) {
        const allCategory =
          response.data?.allCategory ||
          [];

        setCategories(allCategory);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.log(
        "Category fetch error:",
        error
      );

      setCategoryError(
        "Failed to load categories."
      );
    } finally {
      setCategoryLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchCategories();
    }
  }, [open]);

  // =========================================
  // LOAD PRODUCT
  // =========================================

  useEffect(() => {
    const existing =
      product?.raw?.images ||
      product?.existingImages ||
      [];

    const normalizedExisting =
      Array.isArray(existing)
        ? existing
            .map((image) => ({
              _id: image?._id,

              url:
                image?.url ||
                image?.secure_url ||
                "",

              public_id:
                image?.public_id ||
                "",

              isMain:
                image?.isMain === true,
            }))
            .filter(
              (image) => image.url
            )
        : [];

    const mainExisting =
      normalizedExisting.find(
        (image) => image.isMain
      ) ||
      normalizedExisting[0];

    const discountType =
      normalizeDiscountType(
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
        product?.status
          ?.toLowerCase?.() ||
        "",

      discountType,

      discountValue:
        getDiscountValue(product),

      discountStartDate:
        toDateInputValue(
          product?.raw
            ?.discountStartDate ||
            product?.discountStartDate
        ),

      discountEndDate:
        toDateInputValue(
          product?.raw
            ?.discountEndDate ||
            product?.discountEndDate
        ),

      features:
        Array.isArray(rawFeatures)
          ? rawFeatures.join(", ")
          : rawFeatures || "",
    });

    setSpecifications(
      Array.isArray(rawSpecs) &&
        rawSpecs.length
        ? rawSpecs.map((s) => ({
            name: s.name || "",
            value: s.value || "",
          }))
        : [
            {
              name: "",
              value: "",
            },
          ]
    );

    setExistingImages(
      normalizedExisting
    );

    setNewImages([]);
    setNewPreviews([]);

    // =======================================
    // MAIN IMAGE
    // =======================================

    if (mainExisting) {
      setMainKey(
        mainExisting._id ||
          `existing-0`
      );
    } else {
      setMainKey(null);
    }

    setImageError("");
    setFormError("");
    setCategoryError("");
  }, [product, open]);

  // =========================================
  // DISCOUNT PRICE
  // =========================================

  const salePrice = useMemo(() => {
    return calculateDiscountPrice({
      price: form.price,

      discountType:
        form.discountType,

      discountValue:
        form.discountValue,

      discountStartDate:
        form.discountStartDate,

      discountEndDate:
        form.discountEndDate,

      fallbackDiscountPrice:
        form.discountPrice,
    });
  }, [
    form.discountEndDate,
    form.discountPrice,
    form.discountStartDate,
    form.discountType,
    form.discountValue,
    form.price,
  ]);

  if (!open) {
    return null;
  }

  // =========================================
  // TOTAL IMAGE
  // =========================================

  const totalImageCount =
    existingImages.length +
    newImages.length;

  // =========================================
  // UPDATE FORM
  // =========================================

  const update = (
    key,
    value
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  // =========================================
  // CATEGORY HELPERS
  // =========================================

  const normalizedCategoryInput =
    String(form.category || "")
      .trim()
      .toLowerCase();

  const filteredCategories =
    categories.filter(
      (category) => {
        const categoryName =
          String(
            category?.name ||
              category
          );

        return categoryName
          .toLowerCase()
          .includes(
            normalizedCategoryInput
          );
      }
    );

  const exactCategoryExists =
    categories.some(
      (category) => {
        const categoryName =
          String(
            category?.name ||
              category
          )
            .trim()
            .toLowerCase();

        return (
          categoryName ===
          normalizedCategoryInput
        );
      }
    );

  // =========================================
  // CREATE CATEGORY
  // =========================================

  const createNewCategory =
    async () => {
      const categoryName =
        String(
          form.category || ""
        ).trim();

      if (!categoryName) {
        setCategoryError(
          "Please enter a category name."
        );

        return;
      }

      if (exactCategoryExists) {
        const existingCategory =
          categories.find(
            (category) => {
              const name =
                String(
                  category?.name ||
                    category
                )
                  .trim()
                  .toLowerCase();

              return (
                name ===
                categoryName.toLowerCase()
              );
            }
          );

        update(
          "category",
          existingCategory?.name ||
            categoryName
        );

        setShowCategoryOptions(
          false
        );

        setCategoryError("");

        return;
      }

      try {
        setCategoryCreating(true);
        setCategoryError("");

        const response =
          await axios.post(
            `${API_ORIGIN}/api/v1/product/createCategory`,
            {
              name: categoryName,
            }
          );

        if (
          !response.data?.success
        ) {
          setCategoryError(
            response.data?.message ||
              "Failed to create category."
          );

          return;
        }

        const newCategory =
          response.data?.category ||
          response.data
            ?.newCategory ||
          response.data
            ?.createdCategory;

        const createdCategory =
          newCategory?.name ||
          newCategory ||
          categoryName;

        setCategories(
          (current) => {
            const alreadyExists =
              current.some(
                (category) => {
                  const name =
                    String(
                      category?.name ||
                        category
                    )
                      .trim()
                      .toLowerCase();

                  return (
                    name ===
                    String(
                      createdCategory
                    )
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
                name:
                  createdCategory,
              },
            ];
          }
        );

        update(
          "category",
          createdCategory
        );

        setShowCategoryOptions(
          false
        );

        setCategoryError("");
      } catch (error) {
        console.log(
          "Create category error:",
          error
        );

        setCategoryError(
          error.response?.data
            ?.message ||
            "Failed to create category."
        );
      } finally {
        setCategoryCreating(false);
      }
    };

  // =========================================
  // SPECIFICATION
  // =========================================

  const updateSpec = (
    index,
    field,
    value
  ) => {
    setSpecifications(
      (prev) =>
        prev.map(
          (s, i) =>
            i === index
              ? {
                  ...s,
                  [field]:
                    value,
                }
              : s
        )
    );
  };

  const addSpecRow = () => {
    setSpecifications(
      (prev) => [
        ...prev,
        {
          name: "",
          value: "",
        },
      ]
    );
  };

  const removeSpecRow = (
    index
  ) => {
    setSpecifications(
      (prev) =>
        prev.filter(
          (_, i) =>
            i !== index
        )
    );
  };

  // =========================================
  // ADD IMAGES
  // =========================================

  const addImages = (
    event
  ) => {
    const files = Array.from(
      event.target.files || []
    );

    if (!files.length) {
      return;
    }

    setImageError("");

    const remainingSlots =
      MAX_IMAGES -
      totalImageCount;

    if (remainingSlots <= 0) {
      setImageError(
        `You can upload a maximum of ${MAX_IMAGES} images.`
      );

      event.target.value = "";

      return;
    }

    const filesToAdd =
      files.slice(
        0,
        remainingSlots
      );

    const startIndex =
      newImages.length;

    if (
      files.length >
      remainingSlots
    ) {
      setImageError(
        `Only first ${remainingSlots} image(s) added. Maximum limit is ${MAX_IMAGES}.`
      );
    }

    setNewImages(
      (current) => [
        ...current,
        ...filesToAdd,
      ]
    );

    setNewPreviews(
      (current) => [
        ...current,

        ...filesToAdd.map(
          (file) =>
            URL.createObjectURL(
              file
            )
        ),
      ]
    );

    // =======================================
    // FIRST NEW IMAGE = MAIN
    // ONLY IF NO MAIN EXISTS
    // =======================================

    setMainKey(
      (current) => {
        if (current) {
          return current;
        }

        return `new-${startIndex}`;
      }
    );

    event.target.value = "";
  };

  // =========================================
  // REMOVE EXISTING IMAGE
  // =========================================

  const removeExistingImage =
    (index) => {
      const removed =
        existingImages[index];

      const removedKey =
        removed?._id ||
        `existing-${index}`;

      const updated =
        existingImages.filter(
          (_, currentIndex) =>
            currentIndex !== index
        );

      setExistingImages(updated);

      setMainKey(
        (current) => {
          // Main image wasn't removed
          if (
            current !== removedKey
          ) {
            return current;
          }

          // Select first remaining existing
          if (updated.length > 0) {
            return (
              updated[0]?._id ||
              "existing-0"
            );
          }

          // Otherwise first new image
          if (
            newImages.length > 0
          ) {
            return "new-0";
          }

          return null;
        }
      );
    };

  // =========================================
  // REMOVE NEW IMAGE
  // =========================================

  const removeNewImage =
    (index) => {
      const removedKey =
        `new-${index}`;

      const updatedNewImages =
        newImages.filter(
          (_, currentIndex) =>
            currentIndex !== index
        );

      setNewImages(
        updatedNewImages
      );

      setNewPreviews(
        (current) =>
          current.filter(
            (_, currentIndex) =>
              currentIndex !== index
          )
      );

      setMainKey(
        (current) => {
          // Removed image was main
          if (
            current === removedKey
          ) {
            if (
              existingImages.length >
              0
            ) {
              return (
                existingImages[0]
                  ?._id ||
                "existing-0"
              );
            }

            if (
              updatedNewImages.length >
              0
            ) {
              return "new-0";
            }

            return null;
          }

          // If current main is a new image,
          // adjust its index after deletion.
          if (
            typeof current ===
              "string" &&
            current.startsWith(
              "new-"
            )
          ) {
            const currentIndex =
              Number(
                current.split("-")[1]
              );

            if (
              currentIndex > index
            ) {
              return `new-${
                currentIndex - 1
              }`;
            }
          }

          return current;
        }
      );
    };

  // =========================================
  // SUBMIT
  // =========================================

  const submit = (
    event
  ) => {
    event.preventDefault();

    setFormError("");

    // ---------------------------------------
    // Required
    // ---------------------------------------

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

    // ---------------------------------------
    // Discount dates
    // ---------------------------------------

    if (
      form.discountType !==
        "none" &&
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

    // ---------------------------------------
    // Flat discount
    // ---------------------------------------

    if (
      form.discountType ===
        "flat" &&
      Number(
        form.discountValue
      ) >= Number(form.price)
    ) {
      setFormError(
        "Discount amount cannot be greater than or equal to product price."
      );

      return;
    }

    // ---------------------------------------
    // Percentage
    // ---------------------------------------

    if (
      form.discountType ===
        "percentage" &&
      Number(
        form.discountValue
      ) > 100
    ) {
      setFormError(
        "Percentage discount cannot be greater than 100%."
      );

      return;
    }

    // ---------------------------------------
    // Specifications
    // ---------------------------------------

    const cleanSpecs =
      specifications
        .map((s) => ({
          name:
            s.name.trim(),
          value:
            s.value.trim(),
        }))
        .filter(
          (s) =>
            s.name &&
            s.value
        );

    // ---------------------------------------
    // Features
    // ---------------------------------------

    const cleanFeatures =
      form.features
        ? form.features
            .split(",")
            .map(
              (feature) =>
                feature.trim()
            )
            .filter(Boolean)
        : [];

    // =======================================
    // MAIN IMAGE INDEX
    // =======================================

    let mainIndex = -1;

    if (
      typeof mainKey ===
        "string" &&
      mainKey.startsWith(
        "new-"
      )
    ) {
      mainIndex = Number(
        mainKey.split("-")[1]
      );
    }

    // =======================================
    // DEBUG
    // =======================================

    console.log(
      "========== PRODUCT SUBMIT =========="
    );

    console.log(
      "mainKey:",
      mainKey
    );

    console.log(
      "mainIndex:",
      mainIndex
    );

    console.log(
      "newImages:",
      newImages
    );

    console.log(
      "existingImages:",
      existingImages
    );

    console.log(
      "====================================="
    );

    // =======================================
    // SAVE
    // =======================================

    onSave({
      ...form,

      id:
        form.id ||
        `prd-${Date.now()}`,

      price:
        Number(form.price),

      stock:
        Number(form.stock || 0),

      discountPrice:
        salePrice,

      specifications:
        cleanSpecs,

      features:
        cleanFeatures,

      // New files
      images:
        newImages,

      // Existing images
      existingImages:
        existingImages.map(
          (image) => ({
            _id:
              image?._id,

            url:
              image?.url ||
              image?.secure_url ||
              "",

            public_id:
              image?.public_id ||
              "",

            isMain:
              image?.isMain ===
              true,
          })
        ),

      // Main image information
      mainKey,

      mainIndex,
    });
  };

  // =========================================
  // JSX
  // =========================================

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/45 p-4">
      <div className="mx-auto my-6 w-full max-w-4xl">
        <Card className="shadow-soft">

          {/* HEADER */}

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

              {/* TITLE */}

              <Field
                label="Title"
                required
                className="sm:col-span-2"
              >
                <Input
                  value={
                    form.title
                  }
                  onChange={(
                    event
                  ) =>
                    update(
                      "title",
                      event.target
                        .value
                    )
                  }
                  placeholder="Product title"
                />
              </Field>

              {/* DESCRIPTION */}

              <Field
                label="Description"
                className="sm:col-span-2"
              >
                <Textarea
                  rows={4}
                  value={
                    form.description
                  }
                  onChange={(
                    event
                  ) =>
                    update(
                      "description",
                      event.target
                        .value
                    )
                  }
                  placeholder="Full product description"
                />
              </Field>

              {/* SHORT DESCRIPTION */}

              <Field
                label="Short Description"
                className="sm:col-span-2"
              >
                <Textarea
                  rows={2}
                  value={
                    form.shortDescription
                  }
                  onChange={(
                    event
                  ) =>
                    update(
                      "shortDescription",
                      event.target
                        .value
                    )
                  }
                  placeholder="One or two lines summary"
                />
              </Field>

              {/* PRICE */}

              <Field
                label="Price"
                required
              >
                <Input
                  type="number"
                  min="0"
                  value={
                    form.price
                  }
                  onChange={(
                    event
                  ) =>
                    update(
                      "price",
                      event.target
                        .value
                    )
                  }
                  placeholder="0"
                />
              </Field>

              {/* STOCK */}

              <Field label="Stock">
                <Input
                  type="number"
                  min="0"
                  value={
                    form.stock
                  }
                  onChange={(
                    event
                  ) =>
                    update(
                      "stock",
                      event.target
                        .value
                    )
                  }
                  placeholder="0"
                />
              </Field>

              {/* BRAND */}

              <Field label="Brand">
                <Input
                  value={
                    form.brand
                  }
                  onChange={(
                    event
                  ) =>
                    update(
                      "brand",
                      event.target
                        .value
                    )
                  }
                  placeholder="Brand name"
                />
              </Field>

              {/* CATEGORY */}

              <Field
                label="Category"
                required
              >
                <div className="relative">

                  <Input
                    value={
                      form.category
                    }
                    onFocus={() =>
                      setShowCategoryOptions(
                        true
                      )
                    }
                    onChange={(
                      event
                    ) => {
                      update(
                        "category",
                        event.target
                          .value
                      );

                      setShowCategoryOptions(
                        true
                      );

                      setCategoryError(
                        ""
                      );
                    }}
                    placeholder="Type or select category"
                    autoComplete="off"
                  />

                  {showCategoryOptions && (
                    <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-md border bg-white shadow-lg">

                      {categoryLoading && (
                        <div className="px-3 py-3 text-sm text-muted-foreground">
                          Loading categories...
                        </div>
                      )}

                      {!categoryLoading &&
                        filteredCategories.length >
                          0 && (
                          <div className="p-1">
                            {filteredCategories.map(
                              (
                                category
                              ) => {
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
                                    {
                                      categoryName
                                    }
                                  </button>
                                );
                              }
                            )}
                          </div>
                        )}

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

                  {categoryError && (
                    <p className="mt-1 text-xs text-red-600">
                      {
                        categoryError
                      }
                    </p>
                  )}

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

              {/* SUB CATEGORY */}

              <Field label="Sub Category">
                <Input
                  value={
                    form.subCategory
                  }
                  onChange={(
                    event
                  ) =>
                    update(
                      "subCategory",
                      event.target
                        .value
                    )
                  }
                  placeholder="e.g. Earbuds"
                />
              </Field>

              {/* TAGS */}

              <Field label="Tags">
                <Input
                  value={
                    form.tag
                  }
                  onChange={(
                    event
                  ) =>
                    update(
                      "tag",
                      event.target
                        .value
                    )
                  }
                  placeholder="wireless, anc, laptop"
                />
              </Field>

              {/* STATUS */}

              <Field
                label="Status"
                required
              >
                <Select
                  value={
                    form.status
                  }
                  onChange={(
                    event
                  ) =>
                    update(
                      "status",
                      event.target
                        .value
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

              {/* FEATURES */}

              <Field
                label="Features"
                className="sm:col-span-2"
              >
                <Input
                  value={
                    form.features
                  }
                  onChange={(
                    event
                  ) =>
                    update(
                      "features",
                      event.target
                        .value
                    )
                  }
                  placeholder="GPS, Bluetooth, Voice Commands, IP68"
                />
              </Field>

              {/* ADDITIONAL INFO */}

              <Field
                label="Additional Information"
                className="sm:col-span-2"
              >
                <Textarea
                  rows={3}
                  value={
                    form.additionalInfo
                  }
                  onChange={(
                    event
                  ) =>
                    update(
                      "additionalInfo",
                      event.target
                        .value
                    )
                  }
                  placeholder="Box contents, warranty, notes..."
                />
              </Field>

              {/* SPECIFICATIONS */}

              <div className="sm:col-span-2 rounded-lg border p-5">

                <div className="mb-4 flex items-center justify-between">

                  <h3 className="text-base font-semibold">
                    Specifications
                  </h3>

                  <button
                    type="button"
                    onClick={
                      addSpecRow
                    }
                    className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    <Plus className="h-4 w-4" />

                    Add row
                  </button>

                </div>

                <div className="flex flex-col gap-3">

                  {specifications.map(
                    (
                      spec,
                      index
                    ) => (
                      <div
                        key={index}
                        className="flex flex-col gap-3 sm:flex-row"
                      >

                        <Input
                          value={
                            spec.name
                          }
                          onChange={(
                            event
                          ) =>
                            updateSpec(
                              index,
                              "name",
                              event.target
                                .value
                            )
                          }
                          placeholder="Battery Life"
                          className="flex-1"
                        />

                        <Input
                          value={
                            spec.value
                          }
                          onChange={(
                            event
                          ) =>
                            updateSpec(
                              index,
                              "value",
                              event.target
                                .value
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

              {/* DISCOUNT */}

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
                      onChange={(
                        event
                      ) =>
                        update(
                          "discountType",
                          event.target
                            .value
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
                      onChange={(
                        event
                      ) =>
                        update(
                          "discountValue",
                          event.target
                            .value
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
                      onChange={(
                        event
                      ) =>
                        update(
                          "discountStartDate",
                          event.target
                            .value
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
                      onChange={(
                        event
                      ) =>
                        update(
                          "discountEndDate",
                          event.target
                            .value
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

              {/* PRODUCT IMAGES */}

              <div className="sm:col-span-2">

                <div className="mb-2 flex items-center justify-between">

                  <label className="block text-sm font-medium">
                    Product Images
                  </label>

                  <span className="text-xs text-muted-foreground">
                    {
                      totalImageCount
                    }
                    /
                    {
                      MAX_IMAGES
                    }
                  </span>

                </div>

                {/* EXISTING */}

                {existingImages.length >
                  0 && (
                  <>
                    <p className="mb-2 text-xs font-medium text-muted-foreground">
                      Current images
                    </p>

                    <ImageGrid
                      images={
                        existingImages.map(
                          (
                            image
                          ) =>
                            imageSrc(
                              image
                            )
                        )
                      }
                      mainKey={
                        mainKey
                      }
                      getKey={(
                        index
                      ) =>
                        existingImages[
                          index
                        ]?._id ||
                        `existing-${index}`
                      }
                      onMain={(
                        key
                      ) =>
                        setMainKey(
                          key
                        )
                      }
                      onRemove={
                        removeExistingImage
                      }
                    />
                  </>
                )}

                {/* UPLOAD */}

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
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={
                      addImages
                    }
                    disabled={
                      totalImageCount >=
                      MAX_IMAGES
                    }
                    className="hidden"
                  />
                </label>

                {imageError && (
                  <p className="mt-2 text-sm text-red-600">
                    {
                      imageError
                    }
                  </p>
                )}

                {/* NEW */}

                {newPreviews.length >
                  0 && (
                  <>
                    <p className="mb-2 mt-4 text-xs font-medium text-muted-foreground">
                      New images
                    </p>

                    <ImageGrid
                      images={
                        newPreviews
                      }
                      mainKey={
                        mainKey
                      }
                      getKey={(
                        index
                      ) =>
                        `new-${index}`
                      }
                      onMain={(
                        key
                      ) =>
                        setMainKey(
                          key
                        )
                      }
                      onRemove={
                        removeNewImage
                      }
                    />
                  </>
                )}

              </div>

              {/* ERROR */}

              {formError && (
                <div className="sm:col-span-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {
                    formError
                  }
                </div>
              )}

              {/* BUTTONS */}

              <div className="flex justify-end gap-2 sm:col-span-2">

                <Button
                  type="button"
                  variant="outline"
                  onClick={
                    onClose
                  }
                  disabled={
                    saving
                  }
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={
                    saving
                  }
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
// FIELD
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

// ===========================================
// IMAGE GRID
// ===========================================

function ImageGrid({
  images,
  mainKey,
  getKey,
  onMain,
  onRemove,
}) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">

      {images.map(
        (src, index) => {
          const key =
            getKey(index);

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

              {/* MAIN */}

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

              {/* REMOVE */}

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
        }
      )}

    </div>
  );
}