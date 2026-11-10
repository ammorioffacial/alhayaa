"use client";
/* eslint-disable @next/next/no-img-element */
// Category management: add, edit, reorder, hide, delete. The server enforces every rule;
// the checks here only give faster feedback.
import { useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, ImageOff, Pencil, Plus, Trash2 } from "lucide-react";
import { ACCENT_PALETTE, MAX_CATEGORIES, canAddCategory, deleteRule } from "@/lib/category-rules";
import type { Category } from "@/lib/catalog";
import { productCount } from "@/lib/arabic-plural";
import Brand from "./brand";
type Form = {
  id?: string;
  name_ar: string;
  description_ar: string;
  image_path: string;
  accent: string;
  is_visible: boolean;
  slug?: string;
};
const blankForm = (): Form => ({
  name_ar: "",
  description_ar: "",
  image_path: "",
  accent: ACCENT_PALETTE[0],
  is_visible: true,
});
const ENDPOINT = "/api/admin/categories";
async function call(method: string, body?: unknown) {
  const res = await fetch(ENDPOINT, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "تعذر إتمام العملية");
  return data;
}
export default function AdminCategories({
  initial,
  initialCounts,
  loadError,
}: {
  initial: Category[];
  initialCounts: Record<string, number>;
  loadError: string;
}) {
  const [categories, setCategories] = useState(initial);
  const [counts, setCounts] = useState(initialCounts);
  const [form, setForm] = useState<Form | null>(null);
  const [deleting, setDeleting] = useState<{ category: Category; target: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(loadError);
  const [message, setMessage] = useState("");
  const atLimit = !canAddCategory(categories.length).ok;
  async function reload() {
    const data = await call("GET");
    setCategories(data.categories);
    setCounts(data.counts);
  }
  /** Runs a server call, then reloads. The call may return a message to show. */
  async function run(action: () => Promise<string | void>) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const msg = await action();
      await reload();
      if (msg) setMessage(msg);
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  function openCreate() {
    const limit = canAddCategory(categories.length);
    if (!limit.ok) return setError(limit.message);
    setError("");
    setMessage("");
    setForm(blankForm());
  }
  function openEdit(c: Category) {
    setError("");
    setMessage("");
    setForm({
      id: c.id,
      name_ar: c.name_ar,
      description_ar: c.description_ar ?? "",
      image_path: c.image_path ?? "",
      accent: c.accent,
      is_visible: c.is_visible,
      slug: c.slug,
    });
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    const fields = {
      name_ar: form.name_ar,
      description_ar: form.description_ar,
      image_path: form.image_path,
      accent: form.accent,
      is_visible: form.is_visible,
    };
    const ok = await run(async () => {
      if (form.id) {
        await call("PUT", { id: form.id, ...fields });
        return "تم حفظ التصنيف.";
      }
      await call("POST", fields);
      return "تمت إضافة التصنيف.";
    });
    if (ok) setForm(null);
  }
  async function upload(file?: File) {
    if (!file || !form) return;
    setError("");
    const data = new FormData();
    data.set("file", file);
    data.set("folder", "categories");
    setBusy(true);
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: data });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "تعذر رفع الصورة.");
      setForm((f) => (f ? { ...f, image_path: body.url } : f));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function startDelete(c: Category) {
    const others = categories.filter((o) => o.id !== c.id);
    setError("");
    setMessage("");
    setDeleting({ category: c, target: others[0]?.id ?? "" });
  }
  async function confirmDelete() {
    if (!deleting) return;
    const { category, target } = deleting;
    const n = counts[category.id] ?? 0;
    const rule = deleteRule({
      categoryCount: categories.length,
      productCount: n,
      targetId: n > 0 ? target || null : null,
      sourceId: category.id,
    });
    if (!rule.ok) return setError(rule.message);
    const ok = await run(async () => {
      const data = await call("DELETE", { id: category.id, target_id: n > 0 ? target : null });
      return data.message as string;
    });
    if (ok) setDeleting(null);
  }
  async function toggleVisible(c: Category) {
    await run(async () => {
      await call("PUT", {
        id: c.id,
        name_ar: c.name_ar,
        description_ar: c.description_ar,
        image_path: c.image_path,
        accent: c.accent,
        is_visible: !c.is_visible,
      });
      return c.is_visible ? "تم إخفاء التصنيف من المتجر." : "أصبح التصنيف ظاهراً في المتجر.";
    });
  }
  async function move(c: Category, direction: "up" | "down") {
    await run(async () => {
      await call("PATCH", { id: c.id, direction });
    });
  }
  return (
    <main className="admin-shell">
      <div className="admin-top">
        <Brand />
        <a href="/admin">لوحة المنتجات</a>
      </div>
      <div className="admin-top admin-heading">
        <div>
          <span className="eyebrow">إدارة المتجر</span>
          <h1>التصنيفات</h1>
          <p>
            {categories.length} من {MAX_CATEGORIES} تصنيفات. الرابط (slug) يُنشأ مرة واحدة عند الإضافة ولا يتغير بعدها.
          </p>
        </div>
        <button className="primary" disabled={busy || atLimit} onClick={openCreate}>
          <Plus size={19} aria-hidden="true" /> إضافة تصنيف
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
      {form && (
        <section className="admin-editor" aria-labelledby="cat-form-title">
          <h2 id="cat-form-title">{form.id ? "تعديل التصنيف" : "تصنيف جديد"}</h2>
          <form className="form" onSubmit={save} aria-busy={busy}>
            <div className="form-grid">
              <label>
                اسم التصنيف
                <input
                  name="category-name"
                  required
                  maxLength={40}
                  value={form.name_ar}
                  onChange={(e) => setForm({ ...form, name_ar: e.target.value })}
                />
              </label>
              <label>
                الرابط (لا يمكن تغييره)
                <input name="category-slug" value={form.slug ?? "يُنشأ تلقائياً"} readOnly dir="ltr" />
              </label>
            </div>
            <label>
              وصف قصير (اختياري، حتى 120 حرفاً)
              <textarea
                name="category-description"
                maxLength={120}
                rows={2}
                value={form.description_ar}
                onChange={(e) => setForm({ ...form, description_ar: e.target.value })}
              />
            </label>
            <label>
              صورة التصنيف (اختيارية، JPG أو PNG أو WebP حتى 5 MB)
              <input
                name="category-image"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                disabled={busy}
                onChange={(e) => upload(e.target.files?.[0])}
              />
            </label>
            {form.image_path ? (
              <div>
                <img className="upload-preview" src={form.image_path} alt="معاينة صورة التصنيف" width={120} height={120} />
                <button type="button" onClick={() => setForm({ ...form, image_path: "" })}>
                  إزالة الصورة
                </button>
              </div>
            ) : (
              <p className="status-message">بدون صورة: يظهر شعار دائري بلون التصنيف.</p>
            )}
            <fieldset className="form-grid">
              <legend>لون التصنيف</legend>
              {ACCENT_PALETTE.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`اللون ${color}`}
                  aria-pressed={form.accent === color}
                  onClick={() => setForm({ ...form, accent: color })}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: color,
                    outline: form.accent === color ? "3px solid #c9a35a" : "none",
                    outlineOffset: 2,
                  }}
                />
              ))}
            </fieldset>
            <label className="check-label">
              <input
                name="category-visible"
                type="checkbox"
                checked={form.is_visible}
                onChange={(e) => setForm({ ...form, is_visible: e.target.checked })}
              />
              ظاهر في المتجر
            </label>
            <div className="editor-actions">
              <button className="primary" disabled={busy}>
                {busy ? "جارٍ الحفظ…" : "حفظ التصنيف"}
              </button>
              <button type="button" disabled={busy} onClick={() => setForm(null)}>
                إلغاء
              </button>
            </div>
          </form>
        </section>
      )}
      {deleting && (
        <section className="admin-editor" aria-labelledby="cat-delete-title">
          <h2 id="cat-delete-title">حذف «{deleting.category.name_ar}»</h2>
          {(counts[deleting.category.id] ?? 0) > 0 ? (
            <>
              <p className="status-message">
                هذا التصنيف فيه {productCount(counts[deleting.category.id] ?? 0)}. اختر تصنيفاً لنقلها إليه قبل الحذف.
              </p>
              <label>
                نقل المنتجات إلى
                <select
                  name="delete-target"
                  value={deleting.target}
                  onChange={(e) => setDeleting({ ...deleting, target: e.target.value })}
                >
                  {categories
                    .filter((c) => c.id !== deleting.category.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name_ar}
                      </option>
                    ))}
                </select>
              </label>
            </>
          ) : (
            <p className="status-message">هذا التصنيف فارغ، وسيُحذف مباشرة.</p>
          )}
          <div className="editor-actions">
            <button className="admin-delete" disabled={busy} onClick={confirmDelete}>
              تأكيد الحذف
            </button>
            <button type="button" disabled={busy} onClick={() => setDeleting(null)}>
              إلغاء
            </button>
          </div>
        </section>
      )}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <caption className="sr-only">التصنيفات وإجراءات إدارتها</caption>
          <thead>
            <tr>
              <th scope="col">الصورة</th>
              <th scope="col">الاسم</th>
              <th scope="col">الرابط</th>
              <th scope="col">المنتجات</th>
              <th scope="col">الظهور</th>
              <th scope="col">الترتيب</th>
              <th scope="col">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c, index) => (
              <tr key={c.id}>
                <td>
                  {c.image_path ? (
                    <img src={c.image_path} alt={c.name_ar} width={62} height={62} loading="lazy" />
                  ) : (
                    <span
                      aria-label="بدون صورة"
                      style={{
                        display: "grid",
                        placeItems: "center",
                        width: 62,
                        height: 62,
                        borderRadius: "50%",
                        background: c.accent,
                        color: "#ffffff",
                      }}
                    >
                      <ImageOff size={20} aria-hidden="true" />
                    </span>
                  )}
                </td>
                <td>{c.name_ar}</td>
                <td>
                  <code dir="ltr">{c.slug}</code>
                </td>
                <td>{productCount(counts[c.id] ?? 0)}</td>
                <td>
                  <button
                    disabled={busy}
                    onClick={() => toggleVisible(c)}
                    aria-label={c.is_visible ? `إخفاء ${c.name_ar}` : `إظهار ${c.name_ar}`}
                  >
                    {c.is_visible ? <Eye size={18} aria-hidden="true" /> : <EyeOff size={18} aria-hidden="true" />}
                    {c.is_visible ? " ظاهر" : " مخفي"}
                  </button>
                </td>
                <td>
                  <button
                    disabled={busy || index === 0}
                    aria-label={`تحريك ${c.name_ar} لأعلى`}
                    onClick={() => move(c, "up")}
                  >
                    <ArrowUp size={18} aria-hidden="true" />
                  </button>
                  <button
                    disabled={busy || index === categories.length - 1}
                    aria-label={`تحريك ${c.name_ar} لأسفل`}
                    onClick={() => move(c, "down")}
                  >
                    <ArrowDown size={18} aria-hidden="true" />
                  </button>
                </td>
                <td>
                  <button disabled={busy} onClick={() => openEdit(c)} aria-label={`تعديل ${c.name_ar}`}>
                    <Pencil size={16} aria-hidden="true" /> تعديل
                  </button>
                  <button
                    className="admin-delete"
                    disabled={busy}
                    onClick={() => startDelete(c)}
                    aria-label={`حذف ${c.name_ar}`}
                  >
                    <Trash2 size={16} aria-hidden="true" /> حذف
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!categories.length && <div className="empty">لا توجد تصنيفات بعد. أضف أول تصنيف للمتجر.</div>}
      </div>
    </main>
  );
}
