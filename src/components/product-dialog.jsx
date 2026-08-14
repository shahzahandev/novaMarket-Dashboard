import { ImagePlus, Save, Star, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/input";
import { calculateDiscountPrice } from "@/lib/discount";

const MAX_IMAGES = 5;
const API_ORIGIN = "https://emart-singlevendor-backend-6.onrender.com";

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
  return new Date(value).toISOString().slice(0, 10);
}

function imageSrc(image) {
  if (!image) return "";
  if (typeof image === "string") return image;
  const url = image.url || image.secure_url || "";
  return url.startsWith("http") ? url : `${API_ORIGIN}${url}`;
}

function normalizeDiscountType(type) {
  const value = String(type || "none").toLowerCase();
  return ["flat", "percentage", "none"].includes(value) ? value : "none";
}

function getDiscountValue(product) {
  const type = normalizeDiscountType(product?.raw?.discountType || product?.discountType);
  const rawValue = product?.raw?.discountValue ?? product?.discountValue;

  if (rawValue !== undefined && rawValue !== null && rawValue !== "") {
    return String(rawValue);
  }

  if (type === "none") return "";

  const price = Number(product?.raw?.price ?? product?.price ?? 0);
  const discountPrice = Number(product?.raw?.discountPrice ?? product?.discountPrice ?? price);

  if (!price || discountPrice >= price) return "";
  if (type === "flat") return String(price - discountPrice);
  if (type === "percentage") return String(Math.round(((price - discountPrice) / price) * 100));

  return "";
}

export function ProductDialog({ open, product, onClose, onSave, saving = false }) {
  const [form, setForm] = useState(emptyProduct);
  const [newImages, setNewImages] = useState([]);
  const [newPreviews, setNewPreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [mainKey, setMainKey] = useState(null);
  const [imageError, setImageError] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const existing = product?.raw?.images || product?.existingImages || [];
    const mainExisting = existing.find((image) => image.isMain) || existing[0];

    const discountType = normalizeDiscountType(product?.raw?.discountType || product?.discountType);

    setForm({
      ...emptyProduct,
      ...product,
      status: product?.raw?.status || product?.status?.toLowerCase?.() || "",
      discountType,
      discountValue: getDiscountValue(product),
      discountStartDate: toDateInputValue(product?.raw?.discountStartDate || product?.discountStartDate),
      discountEndDate: toDateInputValue(product?.raw?.discountEndDate || product?.discountEndDate),
    });
    setExistingImages(existing);
    setNewImages([]);
    setNewPreviews([]);
    setMainKey(mainExisting?._id || (existing.length ? "existing-0" : null));
    setImageError("");
    setFormError("");
  }, [product, open]);

  const salePrice = useMemo(() => {
    return calculateDiscountPrice({
      price: form.price,
      discountType: form.discountType,
      discountValue: form.discountValue,
      discountStartDate: form.discountStartDate,
      discountEndDate: form.discountEndDate,
      fallbackDiscountPrice: form.discountPrice,
    });
  }, [form.discountEndDate, form.discountPrice, form.discountStartDate, form.discountType, form.discountValue, form.price]);

  if (!open) return null;

  const totalImageCount = existingImages.length + newImages.length;
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const addImages = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    setImageError("");
    const remainingSlots = MAX_IMAGES - totalImageCount;

    if (remainingSlots <= 0) {
      setImageError(`You can upload a maximum of ${MAX_IMAGES} images.`);
      event.target.value = "";
      return;
    }

    const filesToAdd = files.slice(0, remainingSlots);
    const startIndex = newImages.length;

    if (files.length > remainingSlots) {
      setImageError(`Only first ${remainingSlots} image(s) added. Maximum limit is ${MAX_IMAGES}.`);
    }

    setNewImages((current) => [...current, ...filesToAdd]);
    setNewPreviews((current) => [
      ...current,
      ...filesToAdd.map((file) => URL.createObjectURL(file)),
    ]);
    setMainKey((current) => current || `new-${startIndex}`);
    event.target.value = "";
  };

  const removeExistingImage = (index) => {
    const removed = existingImages[index];
    const updated = existingImages.filter((_, currentIndex) => currentIndex !== index);
    setExistingImages(updated);
    setMainKey((current) => {
      const removedKey = removed?._id || `existing-${index}`;
      if (current !== removedKey) return current;
      return updated[0]?._id || (updated.length ? "existing-0" : newImages.length ? "new-0" : null);
    });
  };

  const removeNewImage = (index) => {
    setNewImages((current) => current.filter((_, currentIndex) => currentIndex !== index));
    setNewPreviews((current) => current.filter((_, currentIndex) => currentIndex !== index));
    setMainKey((current) => {
      if (current === `new-${index}`) {
        return existingImages[0]?._id || (existingImages.length ? "existing-0" : newImages.length > 1 ? "new-0" : null);
      }

      if (typeof current === "string" && current.startsWith("new-")) {
        const currentIndex = Number(current.split("-")[1]);
        if (currentIndex > index) return `new-${currentIndex - 1}`;
      }

      return current;
    });
  };

  const submit = (event) => {
    event.preventDefault();
    setFormError("");

    if (!form.title || !form.price || !form.category) {
      setFormError("Title, Price, and Category are required.");
      return;
    }

    if (!form.status) {
      setFormError("Status must be selected.");
      return;
    }

    if (
      form.discountType !== "none" &&
      form.discountStartDate &&
      form.discountEndDate &&
      form.discountStartDate > form.discountEndDate
    ) {
      setFormError("Discount start date cannot be after the end date.");
      return;
    }

    if (form.discountType === "flat" && Number(form.discountValue) >= Number(form.price)) {
      setFormError("Discount amount cannot be greater than or equal to product price.");
      return;
    }

    if (form.discountType === "percentage" && Number(form.discountValue) > 100) {
      setFormError("Percentage discount cannot be greater than 100%.");
      return;
    }

    onSave({
      ...form,
      id: form.id || `prd-${Date.now()}`,
      price: Number(form.price),
      stock: Number(form.stock || 0),
      discountPrice: salePrice,
      images: newImages,
      existingImages,
      mainKey,
      mainIndex:
        typeof mainKey === "string" && mainKey.startsWith("new-")
          ? Number(mainKey.split("-")[1])
          : -1,
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/45 p-4">
      <div className="mx-auto my-6 w-full max-w-4xl">
        <Card className="shadow-soft">
          <CardHeader className="flex-row items-start justify-between gap-4 border-b">
            <div>
              <CardTitle className="text-3xl">{product ? "Update Product" : "Add Product"}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {product ? "Edit this product's details." : "Create a new product listing."}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close product form">
              <X className="h-5 w-5" />
            </Button>
          </CardHeader>

          <CardContent className="p-6 sm:p-8">
            <form onSubmit={submit} className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="Title" required className="sm:col-span-2">
                <Input value={form.title} onChange={(event) => update("title", event.target.value)} placeholder="Product title" />
              </Field>

              <Field label="Description" className="sm:col-span-2">
                <Textarea rows={4} value={form.description} onChange={(event) => update("description", event.target.value)} placeholder="Full product description" />
              </Field>

              <Field label="Short Description" className="sm:col-span-2">
                <Textarea rows={2} value={form.shortDescription} onChange={(event) => update("shortDescription", event.target.value)} placeholder="One or two lines summary" />
              </Field>

              <Field label="Price" required>
                <Input type="number" min="0" value={form.price} onChange={(event) => update("price", event.target.value)} placeholder="0" />
              </Field>

              <Field label="Stock">
                <Input type="number" min="0" value={form.stock} onChange={(event) => update("stock", event.target.value)} placeholder="0" />
              </Field>

              <Field label="Brand">
                <Input value={form.brand} onChange={(event) => update("brand", event.target.value)} placeholder="Brand name" />
              </Field>

              <Field label="Category" required>
                <Input value={form.category} onChange={(event) => update("category", event.target.value)} placeholder="e.g. Electronics" />
              </Field>

              <Field label="Sub Category">
                <Input value={form.subCategory} onChange={(event) => update("subCategory", event.target.value)} placeholder="e.g. Earbuds" />
              </Field>

              <Field label="Tag">
                <Input value={form.tag} onChange={(event) => update("tag", event.target.value)} placeholder="e.g. wireless, anc" />
              </Field>

              <Field label="Status" required>
                <Select value={form.status} onChange={(event) => update("status", event.target.value)}>
                  <option value="">Select Status</option>
                  <option value="pending">pending</option>
                  <option value="active">active</option>
                  <option value="inactive">inactive</option>
                </Select>
              </Field>

              <Field label="Additional Information" className="sm:col-span-2">
                <Textarea rows={3} value={form.additionalInfo} onChange={(event) => update("additionalInfo", event.target.value)} placeholder="Box contents, warranty, notes..." />
              </Field>

              <div className="sm:col-span-2 rounded-lg border p-5">
                <h3 className="mb-4 text-base font-semibold">Discount</h3>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                  <Field label="Discount Type">
                    <Select value={form.discountType} onChange={(event) => update("discountType", event.target.value)}>
                      <option value="none">None</option>
                      <option value="flat">Flat</option>
                      <option value="percentage">Percentage</option>
                    </Select>
                  </Field>

                  <Field label={`Discount ${form.discountType === "percentage" ? "(%)" : "(BDT)"}`}>
                    <Input
                      type="number"
                      min="0"
                      value={form.discountValue}
                      onChange={(event) => update("discountValue", event.target.value)}
                      disabled={form.discountType === "none"}
                      placeholder="0"
                    />
                  </Field>

                  <Field label="Sale price preview">
                    <div className="flex h-10 items-center rounded-md bg-muted px-3 text-sm font-semibold">
                      ৳{salePrice.toLocaleString("en-US")}
                    </div>
                  </Field>

                  <Field label="Discount start date">
                    <Input type="date" value={form.discountStartDate} onChange={(event) => update("discountStartDate", event.target.value)} disabled={form.discountType === "none"} />
                  </Field>

                  <Field label="Discount end date">
                    <Input type="date" value={form.discountEndDate} onChange={(event) => update("discountEndDate", event.target.value)} disabled={form.discountType === "none"} />
                  </Field>
                </div>
              </div>

              <div className="sm:col-span-2">
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-medium">Product Images</label>
                  <span className="text-xs text-muted-foreground">{totalImageCount}/{MAX_IMAGES}</span>
                </div>

                {existingImages.length > 0 && (
                  <>
                    <p className="mb-2 text-xs font-medium text-muted-foreground">Current images</p>
                    <ImageGrid
                      images={existingImages.map((image) => imageSrc(image))}
                      mainKey={mainKey}
                      keyPrefix="existing"
                      getKey={(index) => existingImages[index]?._id || `existing-${index}`}
                      onMain={(key) => setMainKey(key)}
                      onRemove={removeExistingImage}
                    />
                  </>
                )}

                <label className="mt-3 flex h-32 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed text-muted-foreground transition hover:border-primary hover:text-primary">
                  <ImagePlus className="h-6 w-6" />
                  <span className="text-sm">
                    {totalImageCount >= MAX_IMAGES ? "Maximum images reached" : "Click to upload images"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={addImages}
                    disabled={totalImageCount >= MAX_IMAGES}
                    className="hidden"
                  />
                </label>

                {imageError && <p className="mt-2 text-sm text-red-600">{imageError}</p>}

                {newPreviews.length > 0 && (
                  <>
                    <p className="mb-2 mt-4 text-xs font-medium text-muted-foreground">New images</p>
                    <ImageGrid
                      images={newPreviews}
                      mainKey={mainKey}
                      keyPrefix="new"
                      getKey={(index) => `new-${index}`}
                      onMain={(key) => setMainKey(key)}
                      onRemove={removeNewImage}
                    />
                  </>
                )}
              </div>

              {formError && (
                <div className="sm:col-span-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {formError}
                </div>
              )}

              <div className="flex justify-end gap-2 sm:col-span-2">
                <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
                <Button type="submit" disabled={saving}>
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : product ? "Update Product" : "Submit"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, required, className = "", children }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}

function ImageGrid({ images, mainKey, getKey, onMain, onRemove }) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
      {images.map((src, index) => {
        const key = getKey(index);
        const active = mainKey === key;

        return (
          <div
            key={`${key}-${src}`}
            className={`group relative aspect-square overflow-hidden rounded-lg border-2 ${active ? "border-primary" : "border-border"}`}
          >
            <img src={src} alt={`Product preview ${index + 1}`} className="h-full w-full object-cover" />

            <button
              type="button"
              onClick={() => onMain(key)}
              className={`absolute left-1 top-1 flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold transition ${
                active ? "bg-primary text-primary-foreground" : "bg-black/60 text-white opacity-0 group-hover:opacity-100"
              }`}
            >
              <Star className="h-2.5 w-2.5" fill={active ? "currentColor" : "none"} />
              {active ? "Main" : "Set main"}
            </button>

            <button
              type="button"
              onClick={() => onRemove(index)}
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
