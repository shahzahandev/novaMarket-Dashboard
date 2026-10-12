import { ImagePlus, Save, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const MAX_IMAGES = 6;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const API_ORIGIN = "https://nova-market-backend-2.onrender.com";

const EMPTY_FORM = {
  eyebrow: "",
  headingFirst: "",
  headingSecond: "",
  paragraph: "",
  buttonText: "",
};

const INPUT_CLASS =
  "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:cursor-not-allowed disabled:opacity-50";

function imageSrc(image) {
  if (!image) return "";

  // New Cloudinary object
  if (typeof image === "object" && image.url) {
    return image.url;
  }

  // Existing full URL
  if (typeof image === "string" && image.startsWith("http")) {
    return image;
  }

  // Old local image
  if (typeof image === "string") {
    return `${API_ORIGIN}/upload/${image}`;
  }

  return "";
}

// Unique identifier for an existing image
function getImageKey(image) {
  if (!image) return "";

  if (typeof image === "object") {
    return image.public_id || image.url || "";
  }

  return image;
}

export function BannerDialog({
  open,
  banner,
  onClose,
  onSave,
  saving = false,
  error = "",
}) {
  const [form, setForm] = useState(EMPTY_FORM);

  const [existingImages, setExistingImages] = useState([]);
  const [removeImages, setRemoveImages] = useState([]);

  const [newImages, setNewImages] = useState([]);
  const [newPreviews, setNewPreviews] = useState([]);

  const [imageError, setImageError] = useState("");

  // Latest previews ref (revoke korar jonno)
  const previewsRef = useRef([]);

  useEffect(() => {
    previewsRef.current = newPreviews;
  }, [newPreviews]);

  // Component unmount hole shob preview URL revoke
  useEffect(() => {
    return () => {
      previewsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  // Load existing banner data (text + images)
  useEffect(() => {
    if (!open) return;

    // Ager session er preview URL gulo clean
    previewsRef.current.forEach((url) => URL.revokeObjectURL(url));

    setForm({
      eyebrow: banner?.eyebrow || "",
      headingFirst: banner?.headingFirst || "",
      headingSecond: banner?.headingSecond || "",
      paragraph: banner?.paragraph || "",
      buttonText: banner?.buttonText || "",
    });

    setExistingImages(Array.isArray(banner?.images) ? banner.images : []);
    setRemoveImages([]);

    setNewImages([]);
    setNewPreviews([]);

    setImageError("");
  }, [banner, open]);

  const totalImageCount = existingImages.length + newImages.length;

  // Text input change
  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  // Add new images
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

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

    const validFiles = [];
    let hasInvalid = false;

    files.forEach((file) => {
      if (!allowedTypes.includes(file.type)) {
        hasInvalid = true;
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        hasInvalid = true;
        return;
      }

      validFiles.push(file);
    });

    if (hasInvalid) {
      setImageError(
        "Some files were rejected. Only JPG, JPEG, PNG and WEBP images up to 5MB are allowed."
      );
    }

    const filesToAdd = validFiles.slice(0, remainingSlots);

    if (validFiles.length > remainingSlots) {
      setImageError(
        `Only first ${remainingSlots} image(s) added. Maximum limit is ${MAX_IMAGES}.`
      );
    }

    if (!filesToAdd.length) {
      event.target.value = "";
      return;
    }

    setNewImages((current) => [...current, ...filesToAdd]);

    const previews = filesToAdd.map((file) => URL.createObjectURL(file));
    setNewPreviews((current) => [...current, ...previews]);

    event.target.value = "";
  };

  // Remove existing image
  const removeExistingImage = (image) => {
    setImageError("");

    const imageKey = getImageKey(image);

    if (!imageKey) return;

    setExistingImages((current) =>
      current.filter((item) => getImageKey(item) !== imageKey)
    );

    // Cloudinary public_id remove list e
    // (old local filename backend e match korbe na, ignore hoye jabe)
    setRemoveImages((current) =>
      current.includes(imageKey) ? current : [...current, imageKey]
    );
  };

  // Remove newly selected image
  const removeNewImage = (index) => {
    setImageError("");

    const previewUrl = newPreviews[index];

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setNewImages((current) => current.filter((_, i) => i !== index));
    setNewPreviews((current) => current.filter((_, i) => i !== index));
  };

  // Submit
  const submit = (event) => {
    event.preventDefault();

    setImageError("");

    // Text validation
    const cleaned = {
      eyebrow: form.eyebrow.trim(),
      headingFirst: form.headingFirst.trim(),
      headingSecond: form.headingSecond.trim(),
      paragraph: form.paragraph.trim(),
      buttonText: form.buttonText.trim(),
    };

    if (Object.values(cleaned).some((value) => !value)) {
      setImageError("All text fields are required.");
      return;
    }

    // Image validation
    if (totalImageCount === 0) {
      setImageError("At least one image is required.");
      return;
    }

    if (totalImageCount > MAX_IMAGES) {
      setImageError(`Maximum ${MAX_IMAGES} images are allowed.`);
      return;
    }

    onSave({
      ...cleaned,
      images: newImages,
      removeImages,
    });
  };

  // Close dialog
  const handleClose = () => {
    if (saving) return;

    previewsRef.current.forEach((url) => URL.revokeObjectURL(url));

    setForm(EMPTY_FORM);
    setExistingImages([]);
    setRemoveImages([]);
    setNewImages([]);
    setNewPreviews([]);
    setImageError("");

    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="max-h-[90vh] w-full max-w-4xl overflow-y-auto bg-white">
        {/* HEADER */}
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <CardTitle className="text-xl font-semibold">
            {banner ? "Update Hero Banner" : "Create Hero Banner"}
          </CardTitle>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClose}
            disabled={saving}
          >
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>

        {/* CONTENT */}
        <CardContent className="p-6">
          <form onSubmit={submit} className="space-y-6">
            {/* ERROR */}
            {(imageError || error) && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {imageError || error}
              </div>
            )}

            {/* HERO TEXTS */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold">Hero Texts</h3>
                <p className="text-sm text-gray-500">
                  Texts shown on the left side of the hero section.
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="eyebrow" className="text-sm font-medium">
                  Eyebrow text
                </label>
                <input
                  id="eyebrow"
                  name="eyebrow"
                  type="text"
                  value={form.eyebrow}
                  onChange={handleChange}
                  disabled={saving}
                  placeholder="New season, new drops"
                  className={INPUT_CLASS}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label
                    htmlFor="headingFirst"
                    className="text-sm font-medium"
                  >
                    Heading part 1 (white)
                  </label>
                  <input
                    id="headingFirst"
                    name="headingFirst"
                    type="text"
                    value={form.headingFirst}
                    onChange={handleChange}
                    disabled={saving}
                    placeholder="Everyday gear,"
                    className={INPUT_CLASS}
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="headingSecond"
                    className="text-sm font-medium"
                  >
                    Heading part 2 (brand color)
                  </label>
                  <input
                    id="headingSecond"
                    name="headingSecond"
                    type="text"
                    value={form.headingSecond}
                    onChange={handleChange}
                    disabled={saving}
                    placeholder="designed with intent."
                    className={INPUT_CLASS}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="paragraph" className="text-sm font-medium">
                  Paragraph
                </label>
                <textarea
                  id="paragraph"
                  name="paragraph"
                  rows={3}
                  value={form.paragraph}
                  onChange={handleChange}
                  disabled={saving}
                  placeholder="Curated tech and lifestyle products from makers who obsess over the details, so you don't have to."
                  className={`${INPUT_CLASS} h-auto resize-y`}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="buttonText" className="text-sm font-medium">
                  Button text
                </label>
                <input
                  id="buttonText"
                  name="buttonText"
                  type="text"
                  value={form.buttonText}
                  onChange={handleChange}
                  disabled={saving}
                  placeholder="Shop the collection"
                  className={INPUT_CLASS}
                />
              </div>
            </div>

            {/* IMAGE COUNT */}
            <div className="flex items-center justify-between border-t pt-6">
              <div>
                <h3 className="text-sm font-semibold">Hero Slider Images</h3>
                <p className="text-sm text-gray-500">
                  Upload up to {MAX_IMAGES} images.
                </p>
              </div>

              <div className="rounded-md bg-gray-100 px-3 py-1 text-sm font-medium">
                {totalImageCount}/{MAX_IMAGES}
              </div>
            </div>

            {/* EXISTING IMAGES */}
            {existingImages.length > 0 && (
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium">Existing Images</h4>
                  <p className="text-xs text-gray-500">
                    These images are already stored in Cloudinary.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {existingImages.map((image, index) => {
                    const key = getImageKey(image) || `existing-${index}`;

                    return (
                      <div
                        key={key}
                        className="group relative overflow-hidden rounded-lg border bg-gray-50"
                      >
                        <img
                          src={imageSrc(image)}
                          alt={`Banner ${index + 1}`}
                          className="aspect-video w-full object-cover"
                        />

                        <button
                          type="button"
                          onClick={() => removeExistingImage(image)}
                          disabled={saving}
                          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                          title="Remove image"
                        >
                          <X className="h-4 w-4" />
                        </button>

                        <div className="absolute bottom-2 left-2 rounded bg-black/70 px-2 py-1 text-xs text-white">
                          Image {index + 1}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* NEW IMAGES */}
            {newImages.length > 0 && (
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium">New Images</h4>
                  <p className="text-xs text-gray-500">
                    These images will be uploaded to Cloudinary when you save.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {newPreviews.map((preview, index) => (
                    <div
                      key={`${preview}-${index}`}
                      className="relative overflow-hidden rounded-lg border bg-gray-50"
                    >
                      <img
                        src={preview}
                        alt={`New banner ${index + 1}`}
                        className="aspect-video w-full object-cover"
                      />

                      <button
                        type="button"
                        onClick={() => removeNewImage(index)}
                        disabled={saving}
                        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                        title="Remove image"
                      >
                        <X className="h-4 w-4" />
                      </button>

                      <div className="absolute bottom-2 left-2 rounded bg-black/70 px-2 py-1 text-xs text-white">
                        New
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* UPLOAD AREA */}
            {totalImageCount < MAX_IMAGES && (
              <div>
                <label
                  htmlFor="banner-images"
                  className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 px-6 py-10 text-center transition hover:border-gray-400 hover:bg-gray-50"
                >
                  <ImagePlus className="mb-3 h-10 w-10 text-gray-400" />

                  <span className="text-sm font-medium text-gray-700">
                    Click to upload banner images
                  </span>

                  <span className="mt-1 text-xs text-gray-500">
                    JPG, JPEG, PNG or WEBP
                  </span>

                  <span className="text-xs text-gray-500">
                    Maximum 5MB per image
                  </span>

                  <span className="mt-2 text-xs font-medium text-gray-600">
                    {MAX_IMAGES - totalImageCount} slot
                    {MAX_IMAGES - totalImageCount !== 1 ? "s" : ""} remaining
                  </span>
                </label>

                <input
                  id="banner-images"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  multiple
                  onChange={addImages}
                  disabled={saving}
                  className="hidden"
                />
              </div>
            )}

            {/* EMPTY STATE */}
            {totalImageCount === 0 && (
              <div className="rounded-lg border border-dashed bg-gray-50 p-8 text-center">
                <ImagePlus className="mx-auto mb-3 h-10 w-10 text-gray-400" />

                <p className="text-sm font-medium text-gray-700">
                  No banner image selected
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Please upload at least one image.
                </p>
              </div>
            )}

            {/* FOOTER BUTTONS */}
            <div className="flex items-center justify-end gap-3 border-t pt-5">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={saving}
              >
                Cancel
              </Button>

              <Button type="submit" disabled={saving || totalImageCount === 0}>
                {saving ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Banner
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}