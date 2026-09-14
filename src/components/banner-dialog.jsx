import { ImagePlus, Save, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const MAX_IMAGES = 6;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const API_ORIGIN =
  "https://nova-market-backend-2.onrender.com";

/*
|--------------------------------------------------------------------------
| Image URL helper
|--------------------------------------------------------------------------
| New Cloudinary image:
| {
|   url: "...",
|   public_id: "ecobazar/banners/..."
| }
|
| Old image:
| "banner.jpg"
|--------------------------------------------------------------------------
*/

function imageSrc(image) {
  if (!image) return "";

  // New Cloudinary object
  if (
    typeof image === "object" &&
    image.url
  ) {
    return image.url;
  }

  // Existing full URL
  if (
    typeof image === "string" &&
    image.startsWith("http")
  ) {
    return image;
  }

  // Old local image
  if (typeof image === "string") {
    return `${API_ORIGIN}/upload/${image}`;
  }

  return "";
}

/*
|--------------------------------------------------------------------------
| Get unique identifier for an existing image
|--------------------------------------------------------------------------
*/

function getImageKey(image) {
  if (!image) return "";

  if (typeof image === "object") {
    return image.public_id || image.url || "";
  }

  return image;
}

/*
|--------------------------------------------------------------------------
| Banner Dialog
|--------------------------------------------------------------------------
*/

export function BannerDialog({
  open,
  banner,
  onClose,
  onSave,
  saving = false,
  error = "",
}) {
  const [existingImages, setExistingImages] = useState([]);
  const [removeImages, setRemoveImages] = useState([]);

  const [newImages, setNewImages] = useState([]);
  const [newPreviews, setNewPreviews] = useState([]);

  const [imageError, setImageError] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Load existing banner images
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!open) return;

    const images = Array.isArray(banner?.images)
      ? banner.images
      : [];

    setExistingImages(images);
    setRemoveImages([]);

    setNewImages([]);
    setNewPreviews([]);

    setImageError("");
  }, [banner, open]);

  /*
  |--------------------------------------------------------------------------
  | Cleanup preview URLs
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    return () => {
      newPreviews.forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  }, [newPreviews]);

  /*
  |--------------------------------------------------------------------------
  | Total image count
  |--------------------------------------------------------------------------
  */

  const totalImageCount =
    existingImages.length + newImages.length;

  /*
  |--------------------------------------------------------------------------
  | Add new images
  |--------------------------------------------------------------------------
  */

  const addImages = (event) => {
    const files = Array.from(
      event.target.files || []
    );

    if (!files.length) return;

    setImageError("");

    /*
    |--------------------------------------------------------------------------
    | Remaining slots
    |--------------------------------------------------------------------------
    */

    const remainingSlots =
      MAX_IMAGES - totalImageCount;

    if (remainingSlots <= 0) {
      setImageError(
        `You can upload a maximum of ${MAX_IMAGES} images.`
      );

      event.target.value = "";
      return;
    }

    /*
    |--------------------------------------------------------------------------
    | Validate files
    |--------------------------------------------------------------------------
    */

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/jpg",
    ];

    const validFiles = [];
    const invalidFiles = [];

    files.forEach((file) => {
      /*
      |-----------------------------------------------
      | File type validation
      |-----------------------------------------------
      */

      if (!allowedTypes.includes(file.type)) {
        invalidFiles.push(
          `${file.name} - unsupported image type`
        );

        return;
      }

      /*
      |-----------------------------------------------
      | File size validation
      |-----------------------------------------------
      */

      if (file.size > MAX_FILE_SIZE) {
        invalidFiles.push(
          `${file.name} - file size exceeds 5MB`
        );

        return;
      }

      validFiles.push(file);
    });

    /*
    |--------------------------------------------------------------------------
    | Show validation error
    |--------------------------------------------------------------------------
    */

    if (invalidFiles.length > 0) {
      setImageError(
        `Some files were rejected. Only JPG, JPEG, PNG and WEBP images up to 5MB are allowed.`
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Respect maximum 6 images
    |--------------------------------------------------------------------------
    */

    const filesToAdd = validFiles.slice(
      0,
      remainingSlots
    );

    if (validFiles.length > remainingSlots) {
      setImageError(
        `Only first ${remainingSlots} image(s) added. Maximum limit is ${MAX_IMAGES}.`
      );
    }

    if (!filesToAdd.length) {
      event.target.value = "";
      return;
    }

    /*
    |--------------------------------------------------------------------------
    | Add files
    |--------------------------------------------------------------------------
    */

    setNewImages((current) => [
      ...current,
      ...filesToAdd,
    ]);

    /*
    |--------------------------------------------------------------------------
    | Create previews
    |--------------------------------------------------------------------------
    */

    const previews = filesToAdd.map((file) =>
      URL.createObjectURL(file)
    );

    setNewPreviews((current) => [
      ...current,
      ...previews,
    ]);

    event.target.value = "";
  };

  /*
  |--------------------------------------------------------------------------
  | Remove existing image
  |--------------------------------------------------------------------------
  */

  const removeExistingImage = (image) => {
    setImageError("");

    const imageKey = getImageKey(image);

    if (!imageKey) return;

    /*
    |--------------------------------------------------------------------------
    | Remove from UI
    |--------------------------------------------------------------------------
    */

    setExistingImages((current) =>
      current.filter(
        (item) =>
          getImageKey(item) !== imageKey
      )
    );

    /*
    |--------------------------------------------------------------------------
    | Add Cloudinary public_id to remove list
    |--------------------------------------------------------------------------
    */

    /*
    For new Cloudinary images:
      image.public_id

    For old local images:
      image itself is filename

    Backend can ignore old local filename
    if it is not a Cloudinary public_id.
    */

    setRemoveImages((current) => {
      if (current.includes(imageKey)) {
        return current;
      }

      return [...current, imageKey];
    });
  };

  /*
  |--------------------------------------------------------------------------
  | Remove newly selected image
  |--------------------------------------------------------------------------
  */

  const removeNewImage = (index) => {
    setImageError("");

    /*
    |--------------------------------------------------------------------------
    | Revoke preview URL
    |--------------------------------------------------------------------------
    */

    const previewUrl = newPreviews[index];

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    /*
    |--------------------------------------------------------------------------
    | Remove file
    |--------------------------------------------------------------------------
    */

    setNewImages((current) =>
      current.filter((_, i) => i !== index)
    );

    /*
    |--------------------------------------------------------------------------
    | Remove preview
    |--------------------------------------------------------------------------
    */

    setNewPreviews((current) =>
      current.filter((_, i) => i !== index)
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Submit
  |--------------------------------------------------------------------------
  */

  const submit = (event) => {
    event.preventDefault();

    setImageError("");

    /*
    |--------------------------------------------------------------------------
    | At least one image required
    |--------------------------------------------------------------------------
    */

    if (totalImageCount === 0) {
      setImageError(
        "At least one image is required."
      );

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | Maximum image validation
    |--------------------------------------------------------------------------
    */

    if (totalImageCount > MAX_IMAGES) {
      setImageError(
        `Maximum ${MAX_IMAGES} images are allowed.`
      );

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | Send data to parent
    |--------------------------------------------------------------------------
    */

    onSave({
      images: newImages,
      removeImages,
    });
  };

  /*
  |--------------------------------------------------------------------------
  | Close dialog
  |--------------------------------------------------------------------------
  */

  const handleClose = () => {
    if (saving) return;

    /*
    |--------------------------------------------------------------------------
    | Cleanup preview URLs
    |--------------------------------------------------------------------------
    */

    newPreviews.forEach((url) => {
      URL.revokeObjectURL(url);
    });

    setExistingImages([]);
    setRemoveImages([]);
    setNewImages([]);
    setNewPreviews([]);
    setImageError("");

    onClose();
  };

  /*
  |--------------------------------------------------------------------------
  | Don't render when closed
  |--------------------------------------------------------------------------
  */

  if (!open) return null;

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        {/* ============================================================
            HEADER
        ============================================================ */}

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

        {/* ============================================================
            CONTENT
        ============================================================ */}

        <CardContent className="p-6">
          <form
            onSubmit={submit}
            className="space-y-6"
          >
            {/* ========================================================
                IMAGE COUNT
            ======================================================== */}

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">
                  Hero Slider Images
                </h3>

                <p className="text-sm text-gray-500">
                  Upload up to {MAX_IMAGES} images.
                </p>
              </div>

              <div className="rounded-md bg-gray-100 px-3 py-1 text-sm font-medium">
                {totalImageCount}/{MAX_IMAGES}
              </div>
            </div>

            {/* ========================================================
                ERROR
            ======================================================== */}

            {(imageError || error) && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {imageError || error}
              </div>
            )}

            {/* ========================================================
                EXISTING IMAGES
            ======================================================== */}

            {existingImages.length > 0 && (
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium">
                    Existing Images
                  </h4>

                  <p className="text-xs text-gray-500">
                    These images are already stored in
                    Cloudinary.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {existingImages.map(
                    (image, index) => {
                      const key =
                        getImageKey(image) ||
                        `existing-${index}`;

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

                          {/* Remove button */}

                          <button
                            type="button"
                            onClick={() =>
                              removeExistingImage(
                                image
                              )
                            }
                            disabled={saving}
                            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                            title="Remove image"
                          >
                            <X className="h-4 w-4" />
                          </button>

                          {/* Image number */}

                          <div className="absolute bottom-2 left-2 rounded bg-black/70 px-2 py-1 text-xs text-white">
                            Image {index + 1}
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            )}

            {/* ========================================================
                NEW IMAGES
            ======================================================== */}

            {newImages.length > 0 && (
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium">
                    New Images
                  </h4>

                  <p className="text-xs text-gray-500">
                    These images will be uploaded to
                    Cloudinary when you save.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {newPreviews.map(
                    (preview, index) => (
                      <div
                        key={`${preview}-${index}`}
                        className="relative overflow-hidden rounded-lg border bg-gray-50"
                      >
                        <img
                          src={preview}
                          alt={`New banner ${index + 1}`}
                          className="aspect-video w-full object-cover"
                        />

                        {/* Remove */}

                        <button
                          type="button"
                          onClick={() =>
                            removeNewImage(index)
                          }
                          disabled={saving}
                          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                          title="Remove image"
                        >
                          <X className="h-4 w-4" />
                        </button>

                        {/* New badge */}

                        <div className="absolute bottom-2 left-2 rounded bg-black/70 px-2 py-1 text-xs text-white">
                          New
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {/* ========================================================
                UPLOAD AREA
            ======================================================== */}

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
                    {MAX_IMAGES - totalImageCount !== 1
                      ? "s"
                      : ""}{" "}
                    remaining
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

            {/* ========================================================
                EMPTY STATE
            ======================================================== */}

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

            {/* ========================================================
                FOOTER BUTTONS
            ======================================================== */}

            <div className="flex items-center justify-end gap-3 border-t pt-5">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={saving}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={
                  saving ||
                  totalImageCount === 0
                }
              >
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