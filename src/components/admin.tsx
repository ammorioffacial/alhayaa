"use client";
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @next/next/no-location-assign-relative-destination -- clear server-rendered authenticated state on logout */
import { useState } from "react";
import { ExternalLink, LogOut, Plus } from "lucide-react";
import { formatPrice, type Category, type Product } from "@/lib/catalog";
import { productCount } from "@/lib/arabic-plural";
import Brand from "./brand";
import AdminDashboard from "./admin-dashboard";
/** The product form's draft. The category is chosen by id from the categories table. */
type Draft = {
  id?: string;
  name: string;
  brand: string;
  category_id: string;
  description: string;
  price: number;
  image_url: string;
  available: boolean;
  featured: boolean;
  is_demo: boolean;
};
function emptyDraft(categories: Category[]): Draft {
  return {
    name: "",
    brand: "",
    category_id: categories[0]?.id ?? "",
    description: "",
    price: 0,
    image_url: "",
    available: true,
    featured: false,
    is_demo: false,
  };
}
export default function Admin({
  initial,
  categories,
  loadError,
}: {
  initial: Product[];
  categories: Category[];
  loadError: string;
}) {
  const [products, setProducts] = useState(initial),
    [search, setSearch] = useState(""),
    [category, setCategory] = useState("الكل"),
    [draft, setDraft] = useState<Draft | null>(null),
    [busy, setBusy] = useState(false),
    [uploading, setUploading] = useState(false),
    [error, setError] = useState(loadError),
    [message, setMessage] = useState("");
  async function api(url: string, method: string, body?: unknown) {
    const res = await fetch(url, {
      method,
      headers:
        body instanceof FormData ? {} : { "Content-Type": "application/json" },
      body:
        body instanceof FormData
          ? body
          : body
            ? JSON.stringify(body)
            : undefined,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "تعذر إتمام العملية");
    return data;
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!draft) return;
    setBusy(true);
    setError("");
    try {
      const { product } = await api(
        "/api/admin/products",
        draft.id ? "PUT" : "POST",
        draft,
      );
      setProducts((p) =>
        draft.id
          ? p.map((v) => (v.id === product.id ? product : v))
          : [product, ...p],
      );
      setDraft(null);
      setMessage("تم حفظ المنتج. سيظهر التغيير عند فتح المتجر أو تحديثه.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove(p: Product) {
    if (!confirm(`هل تريد حذف «${p.name}» نهائياً؟`)) return;
    setBusy(true);
    setError("");
    try {
      await api("/api/admin/products", "DELETE", { id: p.id });
      setProducts((v) => v.filter((x) => x.id !== p.id));
      setMessage("تم حذف المنتج.");
      if (draft?.id === p.id) setDraft(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function upload(file?: File) {
    if (!file) return;
    setError("");
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    ) {
      setError("اختر صورة JPG أو PNG أو WebP لا تتجاوز 5 ميغابايت.");
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.set("file", file);
      const { url } = await api("/api/admin/upload", "POST", form);
      setDraft((d) => (d ? { ...d, image_url: url } : d));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  }
  const shown = products.filter(
    (p) =>
      (category === "الكل" || p.category_id === category) &&
      `${p.name} ${p.brand}`.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <main className="admin-shell">
      <div className="admin-top">
        <Brand />
        <a href="/" target="_blank" rel="noreferrer">
          عرض المتجر <ExternalLink size={16} aria-hidden="true" />
        </a>
        <a href="/admin/categories">التصنيفات</a>
        <button
          disabled={busy || uploading}
          onClick={async () => {
            try {
              await api("/api/auth", "DELETE");
              window.location.assign("/admin/login");
            } catch (e) {
              setError((e as Error).message);
            }
          }}
        >
          <LogOut size={16} aria-hidden="true" />
          تسجيل الخروج
        </button>
      </div>
      <div className="admin-top admin-heading">
        <div>
          <span className="eyebrow">لوحة تحكم الدكتور</span>
          <h1>إدارة المنتجات</h1>
          <p>أضف منتجات الصيدلية وحدّث صورها وأسعارها وتوفرها.</p>
        </div>
        <button
          disabled={busy || uploading}
          className="primary"
          onClick={() => {
            setDraft(emptyDraft(categories));
            setError("");
            setMessage("");
          }}
        >
          <Plus size={19} aria-hidden="true" /> إضافة منتج
        </button>
      </div>
      <AdminDashboard products={products} categories={categories} />
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="status-message" role="status">
          {message}
        </p>
      )}
      {draft && (
        <section className="admin-editor">
          <h2>{draft.id ? "تعديل المنتج" : "منتج جديد"}</h2>
          <form className="form" onSubmit={save} aria-busy={busy || uploading}>
            <div className="form-grid">
              <label>
                اسم المنتج
                <input
                  name="product-name"
                  autoComplete="off"
                  required
                  minLength={2}
                  maxLength={150}
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </label>
              <label>
                الماركة
                <input
                  name="brand"
                  autoComplete="off"
                  required
                  maxLength={80}
                  value={draft.brand}
                  onChange={(e) =>
                    setDraft({ ...draft, brand: e.target.value })
                  }
                />
              </label>
              <label>
                التصنيف
                <select
                  name="category"
                  value={draft.category_id}
                  onChange={(e) => setDraft({ ...draft, category_id: e.target.value })}
                >
                  {/* Visible categories, plus the product's current one even if it is hidden. */}
                  {categories
                    .filter((c) => c.is_visible || c.id === draft.category_id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name_ar}
                        {!c.is_visible ? " (مخفي)" : ""}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                السعر بالدينار العراقي
                <input
                  name="price"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={10000000}
                  step={1}
                  required
                  value={draft.price || ""}
                  onChange={(e) =>
                    setDraft({ ...draft, price: Number(e.target.value) })
                  }
                />
              </label>
            </div>
            <label>
              وصف المنتج
              <textarea
                name="description"
                autoComplete="off"
                required
                minLength={5}
                maxLength={3000}
                value={draft.description}
                onChange={(e) =>
                  setDraft({ ...draft, description: e.target.value })
                }
              />
            </label>
            <label>
              صورة المنتج (JPG / PNG / WebP — حتى 5 MB)
              <input
                name="product-image"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                disabled={uploading || busy}
                onChange={(e) => upload(e.target.files?.[0])}
              />
            </label>
            {uploading && <p role="status">جارٍ رفع الصورة…</p>}
            {draft.image_url && (
              <img
                className="upload-preview"
                src={draft.image_url}
                alt="معاينة صورة المنتج"
                width={140}
                height={140}
              />
            )}
            <label className="check-label">
              <input
                name="available"
                type="checkbox"
                checked={draft.available}
                onChange={(e) =>
                  setDraft({ ...draft, available: e.target.checked })
                }
              />
              متوفر للطلب
            </label>
            <label className="check-label">
              <input
                name="featured"
                type="checkbox"
                checked={draft.featured}
                onChange={(e) =>
                  setDraft({ ...draft, featured: e.target.checked })
                }
              />
              إظهار ضمن المنتجات المميزة
            </label>
            <label className="check-label">
              <input
                name="is-demo"
                type="checkbox"
                checked={draft.is_demo}
                onChange={(e) =>
                  setDraft({ ...draft, is_demo: e.target.checked })
                }
              />
              منتج تجريبي (لا يُطلب فعلياً)
            </label>
            <div className="editor-actions">
              <button className="primary" disabled={busy || uploading}>
                {busy ? "جارٍ الحفظ…" : "حفظ المنتج"}
              </button>
              <button
                type="button"
                disabled={busy || uploading}
                onClick={() => setDraft(null)}
              >
                إلغاء
              </button>
            </div>
          </form>
        </section>
      )}
      <div className="catalog-toolbar">
        <label className="search">
          <input
            name="catalog-search"
            autoComplete="off"
            aria-label="البحث في المنتجات"
            placeholder="ابحث عن اسم أو ماركة…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <select
          name="category-filter"
          aria-label="تصفية حسب التصنيف"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="الكل">الكل</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name_ar}
              {!c.is_visible ? " (مخفي)" : ""}
            </option>
          ))}
        </select>
        <span role="status">
          {productCount(shown.length)}
        </span>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <caption className="sr-only">
            منتجات الصيدلية وإجراءات إدارتها
          </caption>
          <thead>
            <tr>
              <th scope="col">الصورة</th>
              <th scope="col">المنتج</th>
              <th scope="col">التصنيف</th>
              <th scope="col">السعر</th>
              <th scope="col">الحالة</th>
              <th scope="col">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((p) => (
              <tr key={p.id}>
                <td>
                  <img
                    src={p.image_url || "/products/placeholder.svg"}
                    alt={p.name}
                    width={62}
                    height={62}
                    loading="lazy"
                  />
                </td>
                <td>
                  {p.name}
                  {p.is_demo && <small> (تجريبي)</small>}
                </td>
                <td>{p.category?.name_ar ?? "—"}</td>
                <td>{formatPrice(p.price)}</td>
                <td>
                  <span
                    className={`admin-availability${p.available ? "" : " is-unavailable"}`}
                  >
                    {p.available ? "متوفر" : "نفد"}
                  </span>
                </td>
                <td>
                  <button
                    disabled={busy || uploading}
                    onClick={() => {
                      setDraft(p);
                      setError("");
                      setMessage("");
                      window.scrollTo({
                        top: 0,
                        behavior: window.matchMedia(
                          "(prefers-reduced-motion: reduce)",
                        ).matches
                          ? "instant"
                          : "smooth",
                      });
                    }}
                  >
                    تعديل
                  </button>
                  <button
                    className="admin-delete"
                    disabled={busy || uploading}
                    onClick={() => remove(p)}
                  >
                    حذف
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!shown.length && (
          <div className="empty">
            لا توجد منتجات مطابقة. أضف منتجاً أو غيّر البحث.
          </div>
        )}
      </div>
    </main>
  );
}
