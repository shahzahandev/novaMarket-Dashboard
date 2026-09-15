import { Edit3, ImageOff } from "lucide-react";
import { useEffect, useState } from "react";

import { BannerDialog } from "@/components/banner-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// =====================================================
// API
// =====================================================

const API_ORIGIN = "https://nova-market-backend-2.onrender.com";
const API_BASE = `${API_ORIGIN}/api/v1`;

const GET_HERO_SLIDER_URL = `${API_BASE}/banner/getHeroSlider`;
const SAVE_HERO_SLIDER_URL = `${API_BASE}/banner/createHeroSlider`;

// =====================================================
// Image URL Helper
// =====================================================

function imageSrc(image) {
  if (!image) return "";

  // New Cloudinary object
  // {
  //   url: "https://res.cloudinary.com/...",
  //   public_id: "ecobazar/banners/..."
  // }
  if (typeof image === "object" && image?.url) {
    return image.url;
  }

  // Full URL string
  if (
    typeof image === "string" &&
    (image.startsWith("http://") || image.startsWith("https://"))
  ) {
    return image;
  }

  // Old local filename support
  if (typeof image === "string") {
    return `${API_ORIGIN}/upload/${image}`;
  }

  return "";
}

// =====================================================
// Build Banner FormData
// =====================================================

function buildBannerPayload({ images = [], removeImages = [] }) {
  const payload = new FormData();

  // New images
  images.forEach((file) => {
    if (file instanceof File) {
      payload.append("images", file);
    }
  });

  // Removed Cloudinary public IDs
  if (removeImages.length > 0) {
    payload.append(
      "removeImages",
      JSON.stringify(removeImages)
    );
  }

  return payload;
}

// =====================================================
// Banner Page
// =====================================================

export function BannerPage() {
  // ===================================================
  // States
  // ===================================================

  const [banner, setBanner] = useState(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogError, setDialogError] = useState("");

  // ===================================================
  // Fetch Banner
  // ===================================================

  const fetchBanner = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(GET_HERO_SLIDER_URL);

      if (!response.ok) {
        throw new Error("Failed to load banner.");
      }

      const data = await response.json();

      console.log("Hero slider API response:", data);

      const bannerData = data?.data || null;

      if (bannerData && Array.isArray(bannerData.images)) {
        setBanner({
          id: bannerData._id,
          images: bannerData.images,
        });
      } else {
        setBanner(null);
      }
    } catch (err) {
      console.error("Banner fetch error:", err);

      setError(
        err.message || "Banner load kora jayni."
      );

      setBanner(null);
    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // Initial Fetch
  // ===================================================

  useEffect(() => {
    fetchBanner();
  }, []);

  // ===================================================
  // Save Banner
  // Add + Update
  // ===================================================

  const saveBanner = async (formValues) => {
    setSaving(true);
    setDialogError("");
    setError("");

    try {
      const payload = buildBannerPayload({
        images: formValues?.images || [],
        removeImages: formValues?.removeImages || [],
      });

      const response = await fetch(
        SAVE_HERO_SLIDER_URL,
        {
          method: "POST",
          body: payload,
        }
      );

      const responseData = await response
        .json()
        .catch(() => null);

      console.log(
        "Save banner response:",
        responseData
      );

      if (!response.ok) {
        const backendMessage =
          responseData?.message ||
          responseData?.error ||
          "Failed to save banner.";

        throw new Error(backendMessage);
      }

      // ===============================================
      // Update immediately from API response
      // ===============================================

      if (responseData?.data) {
        setBanner({
          id: responseData.data._id,
          images: responseData.data.images || [],
        });
      }

      // ===============================================
      // Fetch latest data from backend
      // ===============================================

      await fetchBanner();

      // Close dialog
      setDialogError("");
      setDialogOpen(false);
    } catch (err) {
      console.error(
        "Banner save error:",
        err
      );

      setDialogError(
        err.message || "Banner save hoyni."
      );

      setDialogOpen(true);
    } finally {
      setSaving(false);
    }
  };

  // ===================================================
  // Dialog Handlers
  // ===================================================

  const openDialog = () => {
    setDialogError("");
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (saving) return;

    setDialogOpen(false);
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
            Homepage Banner
          </h2>

          <p className="mt-2 text-muted-foreground">
            Manage the hero section slider images shown
            on the storefront.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">

          <Button
            variant="outline"
            onClick={fetchBanner}
            disabled={loading || saving}
          >
            {loading ? "Loading..." : "Reload"}
          </Button>

          <Button
            onClick={openDialog}
            disabled={saving}
          >
            <Edit3 className="h-4 w-4" />
            {banner ? "Update Banner" : "Add Banner"}
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
          Current Banner Preview
      ================================================= */}

      <Card>

        <CardHeader>

          <CardTitle>
            Current Banner Images
          </CardTitle>

          <CardDescription>
            {banner?.images?.length || 0}/6 images set
            for the hero slider
          </CardDescription>

        </CardHeader>

        <CardContent>

          {loading ? (
            <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
              Loading banner images...
            </div>
          ) : banner?.images?.length ? (

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">

              {banner.images.map((image, index) => {

                const src = imageSrc(image);

                return (
                  <div
                    key={
                      typeof image === "object"
                        ? image.public_id
                        : image || index
                    }
                    className="aspect-square overflow-hidden rounded-lg border bg-muted"
                  >

                    {src ? (
                      <img
                        src={src}
                        alt={`Banner ${index + 1}`}
                        className="h-full w-full object-cover"
                        onError={(event) => {
                          console.error(
                            "Banner image failed to load:",
                            src
                          );

                          event.currentTarget.style.display =
                            "none";
                        }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <ImageOff className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}

                  </div>
                );
              })}

            </div>

          ) : (

            <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">

              <ImageOff className="h-8 w-8" />

              <p className="text-sm">
                No banner images set yet.
              </p>

            </div>

          )}

        </CardContent>

      </Card>

      {/* =================================================
          Banner Dialog
      ================================================= */}

      <BannerDialog
        open={dialogOpen}
        banner={banner}
        onClose={closeDialog}
        onSave={saveBanner}
        saving={saving}
        error={dialogError}
      />

    </div>
  );
}