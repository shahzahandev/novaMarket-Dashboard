import { Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// =====================================================
// API
// =====================================================

const API_ORIGIN = "https://nova-market-backend-2.onrender.com";
const API_BASE = `${API_ORIGIN}/api/v1`;

const ALL_CATEGORIES_URL = `${API_BASE}/product/allCategory`;

const deleteCategoryUrl = (id) =>
  `${API_BASE}/product/deleteCategory/${id}`;

// =====================================================
// Category Delete Dialog
// =====================================================

export function CategoryDeleteDialog({ open, onClose }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  // ===================================================
  // Fetch Categories
  // ===================================================

  const fetchCategories = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(ALL_CATEGORIES_URL);

      if (!response.ok) {
        throw new Error("Failed to load categories");
      }

      const data = await response.json();

      setCategories(data.allCategory || []);
    } catch (err) {
      console.error(err);

      setError(err.message || "Category load kora jayni.");
    } finally {
      setLoading(false);
    }
  };

  // Dialog khulle protibar fresh category list load hobe
  useEffect(() => {
    if (!open) return;

    fetchCategories();
  }, [open]);

  if (!open) return null;

  // ===================================================
  // Delete Category
  // ===================================================

  const handleDelete = async (category) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${category.name}"? This cannot be undone.`
    );

    if (!confirmed) return;

    setError("");
    setDeletingId(category._id);

    try {
      const response = await fetch(deleteCategoryUrl(category._id), {
        method: "DELETE",
      });

      const responseData = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          responseData?.message ||
            responseData?.error ||
            "Failed to delete category"
        );
      }

      setCategories((current) =>
        current.filter((item) => item._id !== category._id)
      );
    } catch (err) {
      console.error("Category delete error:", err);

      setError(err.message || "Category delete hoyni.");
    } finally {
      setDeletingId(null);
    }
  };

  // ===================================================
  // Render
  // ===================================================

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/45 p-4">
      <div className="mx-auto my-6 w-full max-w-lg">
        <Card className="shadow-soft">
          <CardHeader className="flex-row items-start justify-between gap-4 border-b">
            <div>
              <CardTitle className="text-2xl">Delete Category</CardTitle>

              <p className="mt-1 text-sm text-muted-foreground">
                Select a category below to remove it permanently.
              </p>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Close category dialog"
            >
              <X className="h-5 w-5" />
            </Button>
          </CardHeader>

          <CardContent className="p-6 sm:p-8">
            {error && (
              <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {loading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Loading categories...
              </p>
            ) : categories.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No categories found.
              </p>
            ) : (
              <div className="flex flex-col divide-y divide-border">
                {categories.map((category) => (
                  <div
                    key={category._id}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <span className="text-sm font-medium capitalize">
                      {category.name}
                    </span>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-rose-600"
                      onClick={() => handleDelete(category)}
                      disabled={deletingId === category._id}
                      aria-label={`Delete ${category.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
