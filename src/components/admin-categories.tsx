"use client";
/* eslint-disable @next/next/no-img-element */
// Category management: main sections and their subcategories. Add, edit, reorder, hide, delete.
// The server enforces every rule; the checks here only give faster feedback.
import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, ImageOff, Pencil, Plus, Trash2 } from "lucide-react";
import {
  ACCENT_PALETTE,
  CATEGORY_MESSAGES,
  MAX_MAIN_SECTIONS,
  MAX_SUBCATEGORIES,
  canAddMainSection,
  canAddSubcategory,
  deleteRule,
} from "@/lib/category-rules";
import { isLeaf, mainSections, subcategoriesOf } from "@/lib/category-tree";
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
  parent_id: string | null;
  slug?: string;
};
const blankForm = (parentId: string | null = null): Form => ({
  name_ar: "",
  description_ar: "",
  image_path: "",
  accent: ACCENT_PALETTE[0],
  is_visible: true,
  parent_id: parentId,
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
  const panelRef = useRef<HTMLDivElement>(null);
  /** The editor, delete panel and messages sit above the table; bring them into view after an action. */
  function reveal() {
    setTimeout(() => panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }
  const mains = mainSections(categories);
  const subCount = categories.length - mains.length;
  const atMainLimit = !canAddMainSection(mains.length).ok;
  /** Products in a section, including its subcategories. */
  const sectionTotal = (c: Category) =>
    (counts[c.id] ?? 0) + subcategoriesOf(categories, c.id).reduce((n, s) => n + (counts[s.id] ?? 0), 0);
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
      reveal();
      return false;
    } finally {
      setBusy(false);
      reveal();
    }
  }
  function openCreate(parentId: string | null = null) {
    const limit = parentId
      ? canAddSubcategory(subcategoriesOf(categories, parentId).length)
      : canAddMainSection(mains.length);
    const problem = !limit.ok
      ? limit.message
      : parentId && (counts[parentId] ?? 0) > 0
        ? CATEGORY_MESSAGES.parentHasProducts
        : "";
    if (problem) {
      setMessage("");
      setError(problem);
      return reveal();
    }
    setError("");
    setMessage("");
    setForm(blankForm(parentId));
    reveal();
  }
  function openEdit(c: Category) {
    setError("");
    setMessage("");
    reveal();
    setForm({
      id: c.id,
      name_ar: c.name_ar,
      description_ar: c.description_ar ?? "",
      image_path: c.image_path ?? "",
      accent: c.accent,
      is_visible: c.is_visible,
      parent_id: c.parent_id,
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
      await call("POST", { ...fields, parent_id: form.parent_id });
      return form.parent_id ? "تمت إضافة القسم الفرعي." : "تمت إضافة القسم الرئيسي.";
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
    const children = subcategoriesOf(categories, c.id);
    setError("");
    setMessage("");
    reveal();
    if (children.length > 0) return setError(CATEGORY_MESSAGES.hasChildren(children.length));
    // Products can only move to a leaf (a section without subcategories), other than this one.
    const targets = categories.filter((o) => o.id !== c.id && isLeaf(categories, o.id));
    setDeleting({ category: c, target: targets[0]?.id ?? "" });
  }
  async function confirmDelete() {
    if (!deleting) return;
    const { category, target } = deleting;
    const n = counts[category.id] ?? 0;
    const rule = deleteRule({
      categoryCount: categories.length,
      productCount: n,
      childCount: 0,
      targetId: n > 0 ? target || null : null,
      sourceId: category.id,
    });
    if (!rule.ok) {
      setError(rule.message);
      return reveal();
    }
    const ok = await run(async () => {
      const data = await call("DELETE", { id: category.id, target_id: n > 0 ? target : null });
      return data.message as string;
    });
    if (ok) setDeleting(null);
  }
  async function toggleVisible(c: Category) {
    const hiddenChildren = c.parent_id === null && subcategoriesOf(categories, c.id).length > 0;
    await run(async () => {
      await call("PUT", {
        id: c.id,
        name_ar: c.name_ar,
        description_ar: c.description_ar,
        image_path: c.image_path,
        accent: c.accent,
        is_visible: !c.is_visible,
      });
      if (c.is_visible)
        return hiddenChildren ? "تم إخفاء القسم وأقسامه الفرعية من المتجر." : "تم إخفاء التصنيف من المتجر.";
      return "أصبح التصنيف ظاهراً في المتجر.";
    });
  }
  async function move(c: Category, direction: "up" | "down") {
    await run(async () => {
      await call("PATCH", { id: c.id, direction });
    });
  }
  /** Rows in display order: each main section followed by its subcategories. */
  const rows: { c: Category; siblings: Category[] }[] = mains.flatMap((m) => {
    const subs = subcategoriesOf(categories, m.id);
    return [
      { c: m, siblings: mains },
      ...subs.map((s) => ({ c: s, siblings: subs })),
    ];
  });
  const leafTargets = categories.filter((c) => isLeaf(categories, c.id));
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
            {mains.length} من {MAX_MAIN_SECTIONS} أقسام رئيسية، و{subCount} قسماً فرعياً (حتى {MAX_SUBCATEGORIES} لكل قسم).
            الرابط (slug) يُنشأ مرة واحدة عند الإضافة ولا يتغير بعدها.
          </p>
        </div>
        <button className="primary" disabled={busy || atMainLimit} onClick={() => openCreate(null)}>
          <Plus size={19} aria-hidden="true" /> إضافة قسم رئيسي
        </button>
      </div>
      <div ref={panelRef} className="admin-panel-anchor">
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
          <h2 id="cat-form-title">
            {form.id ? "تعديل التصنيف" : form.parent_id ? "قسم فرعي جديد" : "قسم رئيسي جديد"}
          </h2>
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
              القسم الأب
              <select
                name="category-parent"
                disabled={!!form.id}
                value={form.parent_id ?? ""}
                onChange={(e) => setForm({ ...form, parent_id: e.target.value || null })}
              >
                <option value="">قسم رئيسي (لا أب)</option>
                {mains.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name_ar}
                  </option>
                ))}
              </select>
            </label>
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
                هذا التصنيف فيه {productCount(counts[deleting.category.id] ?? 0)}. اختر تصنيفاً فرعياً أو قسماً بلا أقسام فرعية لنقلها إليه قبل الحذف.
              </p>
              <label>
                نقل المنتجات إلى
                <select
                  name="delete-target"
                  value={deleting.target}
                  onChange={(e) => setDeleting({ ...deleting, target: e.target.value })}
                >
                  {leafTargets
                    .filter((c) => c.id !== deleting.category.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.parent_id ? `${categories.find((p) => p.id === c.parent_id)?.name_ar ?? ""} › ${c.name_ar}` : c.name_ar}
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
      </div>
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
            {rows.map(({ c, siblings }) => {
              const index = siblings.findIndex((s) => s.id === c.id);
              const isMain = c.parent_id === null;
              const children = isMain ? subcategoriesOf(categories, c.id).length : 0;
              return (
                <tr key={c.id} className={isMain ? "" : "admin-subrow"}>
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
                  <td style={{ paddingInlineStart: isMain ? undefined : 36 }}>
                    {isMain ? <strong>{c.name_ar}</strong> : <>— {c.name_ar}</>}
                  </td>
                  <td>
                    <code dir="ltr">{c.slug}</code>
                  </td>
                  <td>
                    {isMain && children > 0 ? (
                      <>
                        {productCount(sectionTotal(c))}
                        <small> (في {children} أقسام فرعية)</small>
                      </>
                    ) : (
                      productCount(counts[c.id] ?? 0)
                    )}
                  </td>
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
                      disabled={busy || index === siblings.length - 1}
                      aria-label={`تحريك ${c.name_ar} لأسفل`}
                      onClick={() => move(c, "down")}
                    >
                      <ArrowDown size={18} aria-hidden="true" />
                    </button>
                  </td>
                  <td>
                    {isMain && (
                      <button
                        disabled={busy || !canAddSubcategory(children).ok}
                        title={(counts[c.id] ?? 0) > 0 ? CATEGORY_MESSAGES.parentHasProducts : undefined}
                        onClick={() => openCreate(c.id)}
                        aria-label={`إضافة قسم فرعي داخل ${c.name_ar}`}
                      >
                        <Plus size={16} aria-hidden="true" /> قسم فرعي
                      </button>
                    )}
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
              );
            })}
          </tbody>
        </table>
        {!categories.length && <div className="empty">لا توجد تصنيفات بعد. أضف أول قسم رئيسي للمتجر.</div>}
      </div>
    </main>
  );
}
