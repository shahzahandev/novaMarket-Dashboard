import {
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const API_ORIGIN = "https://nova-market-backend-2.onrender.com";
const API_BASE = `${API_ORIGIN}/api/v1/category`;
const ALL_CATEGORIES_URL = `${API_BASE}/allCategory`;
const CREATE_CATEGORY_URL = `${API_BASE}/createCategory`;
const updateCategoryUrl = (id) => `${API_BASE}/updateCategory/${id}`;
const deleteCategoryUrl = (id) => `${API_BASE}/deleteCategory/${id}`;

const STATUS_STYLES = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  hold: "bg-amber-50 text-amber-700 border-amber-200",
};

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${
        STATUS_STYLES[status] || "bg-slate-50 text-slate-600 border-slate-200"
      }`}
    >
      {status}
    </span>
  );
}

// Response theke data ba error message ber korar helper
async function parseResponse(response, fallbackMessage) {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || data?.error || fallbackMessage);
  }

  return data;
}


function CategoryFormDialog({ mode, category, saving, onClose, onSubmit }) {
  const isEdit = mode === "edit";

  const [name, setName] = useState(category?.name || "");
  const [status, setStatus] = useState(category?.status || "active");
  const [localError, setLocalError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    setLocalError("");

    if (!name.trim()) {
      setLocalError("Category name is required");
      return;
    }
    onSubmit({ name: name.trim(), status });
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-slate-950/45 p-4">
      <div className="mx-auto my-10 w-full max-w-md">
        <Card className="shadow-soft">
          <CardHeader className="flex-row items-start justify-between gap-4 border-b">
            <div>
              <CardTitle className="text-xl">
                {isEdit ? "Edit Category" : "Create Category"}
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {isEdit
                  ? "Name ba status poriborton korte paro."
                  : "Notun category-r name dao."}
              </p>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              disabled={saving}
              aria-label="Close dialog"
            >
              <X className="h-5 w-5" />
            </Button>
          </CardHeader>

          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {localError && (
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {localError}
                </div>
              )}

              {/* Name */}
              <div className="space-y-2">
                <label htmlFor="category-name" className="text-sm font-medium">
                  Category name
                </label>
                <input
                  id="category-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Electronics"
                  autoFocus
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Status (sudhu edit-e) */}
              {isEdit && (
                <div className="space-y-2">
                  <span className="text-sm font-medium">Status</span>
                  <div className="grid grid-cols-2 gap-2">
                    {["active", "hold"].map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setStatus(option)}
                        className={`rounded-md border px-3 py-2 text-sm font-medium capitalize transition ${
                          status === option
                            ? option === "active"
                              ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                              : "border-amber-500 bg-amber-50 text-amber-700"
                            : "border-border text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEdit ? "Save changes" : "Create"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// =====================================================
// Category Manager (list + create + edit + delete)
// =====================================================

export default function CategoryManager() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);


  const fetchCategories = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(ALL_CATEGORIES_URL);
      const data = await parseResponse(response, "Failed to load categories");
      setCategories(data.allCategory || []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Category load kora jayni.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Success message kichukkhon pore nijei soriye jabe
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 3000);
    return () => clearTimeout(timer);
  }, [notice]);

  // ===================================================
  // Create
  // ===================================================

  const handleCreate = async ({ name }) => {
    setSaving(true);
    setError("");

    try {
      const response = await fetch(CREATE_CATEGORY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      const data = await parseResponse(response, "Failed to create category");

      if (data?.category) {
        setCategories((current) => [...current, data.category]);
      } else {
        await fetchCategories();
      }

      setCreateOpen(false);
      setNotice("Category created successfully");
    } catch (err) {
      console.error("Category create error:", err);
      setError(err.message || "Category create hoyni.");
      setCreateOpen(false);
    } finally {
      setSaving(false);
    }
  };

  // ===================================================
  // Update (name / status)
  // ===================================================

  const handleUpdate = async ({ name, status }) => {
    const target = editingCategory;
    if (!target) return;

    // Jeta change hoyeche sudhu seta pathabo
    const payload = {};
    if (name !== target.name) payload.name = name;
    if (status !== target.status) payload.status = status;

    if (Object.keys(payload).length === 0) {
      setEditingCategory(null);
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch(updateCategoryUrl(target._id), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await parseResponse(response, "Failed to update category");

      setCategories((current) =>
        current.map((item) =>
          item._id === target._id ? data.category || { ...item, ...payload } : item
        )
      );

      setEditingCategory(null);
      setNotice("Category updated successfully");
    } catch (err) {
      console.error("Category update error:", err);
      setError(err.message || "Category update hoyni.");
      setEditingCategory(null);
    } finally {
      setSaving(false);
    }
  };

  // Delete
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

      await parseResponse(response, "Failed to delete category");

      setCategories((current) =>
        current.filter((item) => item._id !== category._id)
      );
      setNotice("Category deleted successfully");
    } catch (err) {
      console.error("Category delete error:", err);
      setError(err.message || "Category delete hoyni.");
    } finally {
      setDeletingId(null);
    }
  };

  // Render
  return (
    <div className="space-y-4">
      <Card className="shadow-soft">
        <CardHeader className="flex-row items-center justify-between gap-4 border-b">
          <div>
            <CardTitle className="text-2xl">Categories</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Total {categories.length}{" "}
              {categories.length === 1 ? "category" : "categories"}
            </p>
          </div>

          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          {/* Messages */}
          {(error || notice) && (
            <div className="space-y-2 px-6 pt-4">
              {error && (
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}
              {notice && (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {notice}
                </div>
              )}
            </div>
          )}

          {/* List */}
          {loading ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Loading categories...
            </p>
          ) : categories.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No categories found. "Create" button-e click kore notun category banao.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="w-16 px-6 py-3 font-medium">SL</th>
                    <th className="px-6 py-3 font-medium">Name</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 text-right font-medium">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border">
                  {categories.map((category, index) => (
                    <tr key={category._id} className="hover:bg-muted/40">
                      <td className="px-6 py-3 text-muted-foreground">
                        {index + 1}
                      </td>

                      <td className="px-6 py-3 font-medium capitalize">
                        {category.name}
                      </td>

                      <td className="px-6 py-3">
                        <StatusBadge status={category.status} />
                      </td>

                      <td className="px-6 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-sky-600"
                            onClick={() => setEditingCategory(category)}
                            disabled={deletingId === category._id}
                            aria-label={`Edit ${category.name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-rose-600"
                            onClick={() => handleDelete(category)}
                            disabled={deletingId === category._id}
                            aria-label={`Delete ${category.name}`}
                          >
                            {deletingId === category._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create dialog */}
      {createOpen && (
        <CategoryFormDialog
          mode="create"
          saving={saving}
          onClose={() => setCreateOpen(false)}
          onSubmit={handleCreate}
        />
      )}

      {/* Edit dialog */}
      {editingCategory && (
        <CategoryFormDialog
          mode="edit"
          category={editingCategory}
          saving={saving}
          onClose={() => setEditingCategory(null)}
          onSubmit={handleUpdate}
        />
      )}
    </div>
  );
}

// =====================================================
// Popup wrapper (products.jsx theke open / onClose diye cholbe)
// =====================================================

export function CategoryDialog({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/45 p-4">
      <div className="mx-auto my-6 w-full max-w-3xl">
        <div className="mb-2 flex justify-end">
          <Button
            variant="secondary"
            size="icon"
            onClick={onClose}
            aria-label="Close category dialog"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <CategoryManager />
      </div>
    </div>
  );
}