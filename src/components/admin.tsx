"use client";
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @next/next/no-location-assign-relative-destination -- clear server-rendered authenticated state on logout */
import { useState } from "react";
import { categories, money, type Product } from "@/lib/catalog";
import Brand from "./brand";
const empty: Omit<Product, "id"> = {
  name: "",
  brand: "",
  category: categories[0],
  description: "",
  price: 0,
  image_url: "",
  available: true,
  featured: false,
  is_demo: false,
};
export default function Admin({
  initial,
  loadError,
}: {
  initial: Product[];
  loadError: string;
}) {
  const [products, setProducts] = useState(initial),
    [search, setSearch] = useState(""),
    [category, setCategory] = useState("الكل"),
    [draft, setDraft] = useState<(typeof empty & { id?: string }) | null>(null),
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
      (category === "الكل" || p.category === category) &&
      `${p.name} ${p.brand}`.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <main className="admin-shell">
      <div className="admin-top">
        <Brand />
        <a href="/" target="_blank" rel="noreferrer">
          عرض المتجر ↗
        </a>
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
          تسجيل الخروج
        </button>
      </div>
      <div className="admin-top">
        <div>
          <span className="eyebrow">لوحة تحكم الدكتور</span>
          <h1>إدارة المنتجات</h1>
        </div>
        <button
          disabled={busy || uploading}
          className="primary"
          onClick={() => {
            setDraft({ ...empty });
            setError("");
            setMessage("");
          }}
        >
          + إضافة منتج
        </button>
      </div>
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
          <form className="form" onSubmit={save}>
            <div className="form-grid">
              <label>
                اسم المنتج
                <input
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
                  value={draft.category}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      category: e.target.value as typeof draft.category,
                    })
                  }
                >
                  {categories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label>
                السعر بالدينار العراقي
                <input
                  type="number"
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
              />
            )}
            <label className="check-label">
              <input
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
            aria-label="البحث في المنتجات"
            placeholder="ابحث عن اسم أو ماركة"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <select
          aria-label="تصفية حسب التصنيف"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option>الكل</option>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <span>{shown.length} منتجات</span>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>الصورة</th>
              <th>المنتج</th>
              <th>التصنيف</th>
              <th>السعر</th>
              <th>الحالة</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((p) => (
              <tr key={p.id}>
                <td>
                  <img
                    src={p.image_url || "/products/placeholder.svg"}
                    alt={p.name}
                  />
                </td>
                <td>
                  {p.name}
                  {p.is_demo && <small> (تجريبي)</small>}
                </td>
                <td>{p.category}</td>
                <td>{money(p.price)}</td>
                <td>{p.available ? "متوفر" : "نفد"}</td>
                <td>
                  <button
                    disabled={busy || uploading}
                    onClick={() => {
                      setDraft(p);
                      setError("");
                      setMessage("");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    تعديل
                  </button>
                  <button
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
