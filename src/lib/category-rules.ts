import { z } from "zod";
// Pure category rules: no database or network access, so they can be unit tested.
// The database enforces the same limits (migration 0001 trigger, migration 0002 functions).
export const MAX_CATEGORIES = 8;
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
  maxReached: "لا يمكن إضافة أكثر من 8 تصنيفات.",
  lastCategory: "يجب أن يبقى تصنيف واحد على الأقل.",
  needsTarget: (n: number) =>
    `هذا التصنيف فيه ${n} منتجات. اختر تصنيفاً لنقلها إليه قبل الحذف.`,
  deleted: (n: number) => `تم حذف التصنيف ونقل ${n} منتجات.`,
  slugLocked: "لا يمكن تغيير رابط التصنيف (slug) بعد إنشائه.",
} as const;
/** Whether one more category may be created. */
export function canAddCategory(existingCount: number) {
  return existingCount < MAX_CATEGORIES
    ? { ok: true as const }
    : { ok: false as const, message: CATEGORY_MESSAGES.maxReached };
}
/**
 * The delete rule, applied on the server before the database function runs.
 * - The last remaining category cannot be deleted.
 * - A category with products needs a different target category.
 * - An empty category is deleted directly (no target needed).
 */
export function deleteRule(input: {
  categoryCount: number;
  productCount: number;
  targetId: string | null;
  sourceId: string;
}):
  | { ok: true; moved: number }
  | { ok: false; message: string } {
  if (input.categoryCount <= 1)
    return { ok: false, message: CATEGORY_MESSAGES.lastCategory };
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
/** Edit payload: the id plus the editable fields. Any other key (including slug) is dropped. */
export const categoryUpdateSchema = categoryFieldsSchema.extend({
  id: z.string().uuid(),
});
