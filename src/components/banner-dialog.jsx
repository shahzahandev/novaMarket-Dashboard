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
const API_ORIGIN = "https://nova-market-backend-2.onrender.com";

function imageSrc(filename) {
  if (!filename) return "";
  if (typeof filename === "string" && filename.startsWith("http")) {
    return filename;
  }
  return `${API_ORIGIN}/upload/${filename}`;
}

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

  useEffect(() => {
    if (!open) return;

    setExistingImages(banner?.images || []);
    setRemoveImages([]);
    setNewImages([]);
    setNewPreviews([]);
    setImageError("");
  }, [banner, open]);

  if (!open) return null;

  const totalImageCount =
    existingImages.length + newImages.length;

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

    if (files.length > remainingSlots) {
      setImageError(
        `Only first ${remainingSlots} image(s) added. Maximum limit is ${MAX_IMAGES}.`
      );
    }

    setNewImages((current) => [...current, ...filesToAdd]);
    setNewPreviews((current) => [
      ...current,
      ...filesToAdd.map((file) => URL.createObjectURL(file)),
    ]);

    event.target.value = "";
  };

  const removeExistingImage = (filename) => {
    setExistingImages((current) =>
      current.filter((image) => image !== filename)
    );
    setRemoveImages((current) => [...current, filename]);
  };

  const removeNewImage = (index) => {
    setNewImages((current) => current.filter((_, i) => i !== index));
    setNewPreviews((current) => current.filter((_, i) => i !== index));
  };

  const submit = (event) => {
    event.preventDefault();

    if (totalImageCount === 0) {
      setImageError("At least one image is required.");
      return;
    }

    onSave({
      images: newImages,
      removeImages,
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/45 p-4">
      <div className="mx-auto my-6 w-full max-w-2xl">
        <Card className="shadow-soft">
          <CardHeader className="flex-row items-start justify-between gap-4 border-b">
            <div>
              <CardTitle className="text-3xl">
                {banner ? "Update Banner" : "Add Banner"}
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Hero section slider images (max {MAX_IMAGES}).
              </p>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Close banner form"
            >
              <X className="h-5 w-5" />
            </Button>
          </CardHeader>

          <CardContent className="p-6 sm:p-8">
            <form onSubmit={submit} className="flex flex-col gap-5">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-medium">
                    Banner Images
                  </label>
                  <span className="text-xs text-muted-foreground">
                    {totalImageCount}/{MAX_IMAGES}
                  </span>
                </div>

                {existingImages.length > 0 && (
                  <>
                    <p className="mb-2 text-xs font-medium text-muted-foreground">
                      Current images
                    </p>
                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                      {existingImages.map((filename) => (
                        <div
                          key={filename}
                          className="group relative aspect-square overflow-hidden rounded-lg border-2 border-border"
                        >
                          <img
                            src={imageSrc(filename)}
                            alt="Banner"
                            className="h-full w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeExistingImage(filename)}
                            className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition group-hover:opacity-100"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <label className="mt-3 flex h-28 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed text-muted-foreground transition hover:border-primary hover:text-primary">
                  <ImagePlus className="h-6 w-6" />
                  <span className="text-sm">
                    {totalImageCount >= MAX_IMAGES
                      ? "Maximum images reached"
                      : "Click to upload images"}
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

                {imageError && (
                  <p className="mt-2 text-sm text-red-600">{imageError}</p>
                )}

                {newPreviews.length > 0 && (
                  <>
                    <p className="mb-2 mt-4 text-xs font-medium text-muted-foreground">
                      New images
                    </p>
                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                      {newPreviews.map((src, index) => (
                        <div
                          key={src}
                          className="group relative aspect-square overflow-hidden rounded-lg border-2 border-border"
                        >
                          <img
                            src={src}
                            alt={`New banner ${index + 1}`}
                            className="h-full w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeNewImage(index)}
                            className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition group-hover:opacity-100"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {error && (
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : banner ? "Update Banner" : "Submit"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}