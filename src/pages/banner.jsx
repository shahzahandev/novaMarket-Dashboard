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
// Image Src Helper
// =====================================================

function imageSrc(filename) {
  if (!filename) return "";

  if (typeof filename === "string" && filename.startsWith("http")) {
    return filename;
  }

  return `${API_ORIGIN}/upload/${filename}`;
}

// =====================================================
// Build Banner FormData
// =====================================================

function buildBannerPayload({ images, removeImages }) {
  const payload = new FormData();

  images.forEach((file) => {
    if (file instanceof File) {
      payload.append("images", file);
    }
  });

  if (removeImages?.length) {
    payload.append("removeImages", JSON.stringify(removeImages));
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

  const [banner, setBanner] = useState(null); // { id, images: [filenames] }

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
        throw new Error("Failed to load banner");
      }

      const data = await response.json();
      const bannerData = data?.data || null;

      setBanner(
        bannerData && bannerData.images?.length
          ? { id: bannerData._id, images: bannerData.images }
          : null
      );
    } catch (err) {
      console.error(err);
      setError(err.message || "Banner load kora jayni.");
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
  // Add + Update (same API)
  // ===================================================

  const saveBanner = async (formValues) => {
    setSaving(true);

    setDialogError("");
    setError("");

    try {
      const response = await fetch(SAVE_HERO_SLIDER_URL, {
        method: "POST",
        body: buildBannerPayload(formValues),
      });

      const responseData = await response.json().catch(() => null);

      if (!response.ok) {
        const backendMessage =
          responseData?.message ||
          responseData?.error ||
          "Failed to save banner";

        throw new Error(backendMessage);
      }

      // Success
      await fetchBanner();

      setDialogError("");
      setDialogOpen(false);
    } catch (err) {
      console.error("Banner save error:", err);

      setDialogError(err.message || "Banner save hoyni.");

      // Dialog open thakbe, error dialog-er vitore dekhabe
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
            Manage the hero section slider images shown on the storefront.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={fetchBanner} disabled={loading}>
            {loading ? "Loading..." : "Reload"}
          </Button>

          <Button onClick={openDialog}>
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
          <CardTitle>Current Banner Images</CardTitle>
          <CardDescription>
            {banner?.images?.length || 0}/6 images set for the hero slider
          </CardDescription>
        </CardHeader>

        <CardContent>
          {banner?.images?.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
              {banner.images.map((filename) => (
                <div
                  key={filename}
                  className="aspect-square overflow-hidden rounded-lg border"
                >
                  <img
                    src={imageSrc(filename)}
                    alt="Banner"
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
              <ImageOff className="h-8 w-8" />
              <p className="text-sm">No banner images set yet.</p>
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