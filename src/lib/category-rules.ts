import { z } from "zod";
// Pure category rules: no database or network access, so they can be unit tested.
// The database enforces the same limits (migrations 0001, 0002, 0003).
/** At most this many main sections (parent_id null). */
export const MAX_MAIN_SECTIONS = 8;
/** At most this many subcategories inside one main section. */
export const MAX_SUBCATEGORIES = 15;
/** The six palette colors. Must match the check constraint in migration 0001. */
export const ACCENT_PALETTE = [
  "#0f2b45",
  "#28578e",
  "#c9a35a",
  "#b86c7b",
  "#28715a",
  "#8b6127",
] as const;
export const CATEGORY_MESSAGES = {
  maxMainReached: `لا يمكن إضافة أكثر من ${MAX_MAIN_SECTIONS} أقسام رئيسية.`,
  maxSubReached: `لا يمكن إضافة أكثر من ${MAX_SUBCATEGORIES} قسماً فرعياً داخل القسم الواحد.`,
  lastCategory: "يجب أن يبقى تصنيف واحد على الأقل.",
  hasChildren: (n: number) => `هذا القسم فيه ${n} أقسام فرعية. احذفها أولاً.`,
  needsTarget: (n: number) =>
    `هذا التصنيف فيه ${n} منتجات. اختر تصنيفاً لنقلها إليه قبل الحذف.`,
  deleted: (n: number) => `تم حذف التصنيف ونقل ${n} منتجات.`,
  slugLocked: "لا يمكن تغيير رابط التصنيف (slug) بعد إنشائه.",
  parentNotMain: "القسم الأب يجب أن يكون قسماً رئيسياً.",
  parentHasProducts: "هذا القسم فيه منتجات. انقلها إلى قسم آخر قبل إضافة أقسام فرعية إليه.",
} as const;
/** Whether one more main section may be created. */
export function canAddMainSection(mainCount: number) {
  return mainCount < MAX_MAIN_SECTIONS
    ? { ok: true as const }
    : { ok: false as const, message: CATEGORY_MESSAGES.maxMainReached };
}
/** Whether one more subcategory may be created inside a main section. */
export function canAddSubcategory(siblingCount: number) {
  return siblingCount < MAX_SUBCATEGORIES
    ? { ok: true as const }
    : { ok: false as const, message: CATEGORY_MESSAGES.maxSubReached };
}
/**
 * The delete rule, applied on the server before the database function runs.
 * - The last remaining category cannot be deleted.
 * - A main section with subcategories cannot be deleted until they are removed.
 * - A category with products needs a different target category.
 * - An empty category is deleted directly (no target needed).
 */
export function deleteRule(input: {
  categoryCount: number;
  productCount: number;
  childCount?: number;
  targetId: string | null;
  sourceId: string;
}):
  | { ok: true; moved: number }
  | { ok: false; message: string } {
  if (input.categoryCount <= 1)
    return { ok: false, message: CATEGORY_MESSAGES.lastCategory };
  if ((input.childCount ?? 0) > 0)
    return { ok: false, message: CATEGORY_MESSAGES.hasChildren(input.childCount!) };
  if (input.productCount > 0) {
    if (!input.targetId)
      return { ok: false, message: CATEGORY_MESSAGES.needsTarget(input.productCount) };
    if (input.targetId === input.sourceId)
      return { ok: false, message: "لا يمكن نقل المنتجات إلى التصنيف نفسه." };
  }
  return { ok: true, moved: input.productCount };
}
const SLUG_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";
/**
 * A short ASCII slug, generated once at creation. Starts with a letter and avoids collisions.
 * `random` is injectable for tests.
 */
export function generateSlug(
  existing: ReadonlySet<string>,
  random: () => number = Math.random,
): string {
  for (let attempt = 0; attempt < 50; attempt++) {
    let body = "";
    for (let i = 0; i < 6; i++)
      body += SLUG_CHARS[Math.floor(random() * SLUG_CHARS.length)];
    const slug = `c${body}`;
    if (!existing.has(slug) && /^[a-z0-9-]{2,40}$/.test(slug)) return slug;
  }
  throw new Error("تعذر إنشاء رابط فريد للتصنيف.");
}
const httpsOrEmpty = z
  .string()
  .max(1000)
  .refine((v) => v === "" || /^https:\/\//.test(v), "رابط الصورة غير صحيح.");
/** Fields an admin may set when creating or editing a category. The slug is not in this schema. */
export const categoryFieldsSchema = z.object({
  name_ar: z
    .string()
    .trim()
    .min(1, "اكتب اسم التصنيف.")
    .max(40, "اسم التصنيف لا يتجاوز 40 حرفاً."),
  description_ar: z
    .string()
    .trim()
    .max(120, "الوصف لا يتجاوز 120 حرفاً.")
    .optional()
    .nullable()
    .transform((v) => (v ? v : null)),
  image_path: httpsOrEmpty
    .optional()
    .nullable()
    .transform((v) => (v ? v : null)),
  accent: z.enum(ACCENT_PALETTE, { message: "اختر لوناً من الألوان المتاحة." }),
  is_visible: z.boolean(),
});
export type CategoryFields = z.infer<typeof categoryFieldsSchema>;
/** Create payload: the fields plus the parent (null for a main section). */
export const categoryCreateSchema = categoryFieldsSchema.extend({
  parent_id: z.string().uuid().nullable().optional().transform((v) => v ?? null),
});
/**
 * Edit payload: the id plus the editable fields. Any other key (slug, parent_id) is dropped,
 * so neither the link nor the parent can change after creation.
 */
export const categoryUpdateSchema = categoryFieldsSchema.extend({
  id: z.string().uuid(),
});
