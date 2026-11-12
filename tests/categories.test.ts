import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ACCENT_PALETTE,
  CATEGORY_MESSAGES,
  canAddMainSection,
  canAddSubcategory,
  categoryCreateSchema,
  categoryFieldsSchema,
  categoryUpdateSchema,
  deleteRule,
  generateSlug,
  MAX_MAIN_SECTIONS,
  MAX_SUBCATEGORIES,
} from "../src/lib/category-rules";
import { coverage, isLeaf, mainSections, subcategoriesOf } from "../src/lib/category-tree";
import { productCount } from "../src/lib/arabic-plural";
import { nonEmptyPriceBands } from "../src/lib/admin-stats";
import { demoCategories } from "../src/lib/demo";
// Slug: created once, short ASCII, unique, and never changed by an edit.
test("slug is a short ASCII code and retries past an existing slug", () => {
  // Alphabet: a-z (0-25), 0-9 (26-35). Draws for "111111" (index 27) then "999999" (index 35).
  const draws = [...Array(6).fill(27.5 / 36), ...Array(6).fill(35.5 / 36)];
  let i = 0;
  const slug = generateSlug(new Set(["c111111"]), () => draws[i++]);
  assert.equal(slug, "c999999");
  assert.match(slug, /^[a-z0-9-]{2,40}$/);
});
test("slug generation fails loudly instead of returning a duplicate", () => {
  const everything = new Set<string>();
  // Every candidate is taken: a fixed random source always yields the same slug.
  const candidate = generateSlug(new Set(), () => 0);
  everything.add(candidate);
  assert.throws(() => generateSlug(everything, () => 0), /تعذر إنشاء رابط فريد/);
});
test("an edit payload has no slug, so renaming a category cannot change its link", () => {
  const parsed = categoryUpdateSchema.parse({
    id: "00000000-0000-4000-8000-0000000000c1",
    name_ar: "بشرة",
    description_ar: "",
    image_path: "",
    accent: ACCENT_PALETTE[0],
    is_visible: true,
    slug: "hacked-slug",
  });
  assert.equal("slug" in parsed, false);
  assert.equal(parsed.name_ar, "بشرة");
});
test("name, description, and accent are validated on the server", () => {
  const base = { name_ar: "فئة", description_ar: "", image_path: "", accent: ACCENT_PALETTE[0], is_visible: true };
  assert.equal(categoryFieldsSchema.safeParse({ ...base, name_ar: "" }).success, false);
  assert.equal(categoryFieldsSchema.safeParse({ ...base, name_ar: "س".repeat(41) }).success, false);
  assert.equal(categoryFieldsSchema.safeParse({ ...base, description_ar: "و".repeat(121) }).success, false);
  assert.equal(categoryFieldsSchema.safeParse({ ...base, accent: "#ff00ff" }).success, false);
  assert.equal(categoryFieldsSchema.safeParse({ ...base, image_path: "http://insecure.example/x.png" }).success, false);
  assert.equal(categoryFieldsSchema.safeParse({ ...base, description_ar: "" }).data?.description_ar, null);
});
// Delete rule.
test("the last remaining category cannot be deleted", () => {
  const r = deleteRule({ categoryCount: 1, productCount: 0, targetId: null, sourceId: "a" });
  assert.deepEqual(r, { ok: false, message: CATEGORY_MESSAGES.lastCategory });
});
test("a category with products requires a target and gives the Arabic message", () => {
  const r = deleteRule({ categoryCount: 3, productCount: 4, targetId: null, sourceId: "a" });
  assert.deepEqual(r, { ok: false, message: "هذا التصنيف فيه 4 منتجات. اختر تصنيفاً لنقلها إليه قبل الحذف." });
});
test("products cannot be moved into the same category they are leaving", () => {
  const r = deleteRule({ categoryCount: 3, productCount: 2, targetId: "a", sourceId: "a" });
  assert.equal(r.ok, false);
});
test("a category with products is deleted only after all of them move to the target", () => {
  const r = deleteRule({ categoryCount: 3, productCount: 4, targetId: "b", sourceId: "a" });
  assert.deepEqual(r, { ok: true, moved: 4 });
});
test("an empty category is deleted directly, with no target", () => {
  const r = deleteRule({ categoryCount: 3, productCount: 0, targetId: null, sourceId: "a" });
  assert.deepEqual(r, { ok: true, moved: 0 });
});
test("the completed-delete message uses the moved count", () => {
  assert.equal(CATEGORY_MESSAGES.deleted(4), "تم حذف التصنيف ونقل 4 منتجات.");
});
// Limits: eight main sections, fifteen subcategories per section.
test("no more than eight main sections, and fifteen subcategories per section", () => {
  assert.equal(MAX_MAIN_SECTIONS, 8);
  assert.equal(MAX_SUBCATEGORIES, 15);
  assert.equal(canAddMainSection(7).ok, true);
  assert.deepEqual(canAddMainSection(8), { ok: false, message: "لا يمكن إضافة أكثر من 8 أقسام رئيسية." });
  assert.equal(canAddSubcategory(14).ok, true);
  assert.deepEqual(canAddSubcategory(15), {
    ok: false,
    message: "لا يمكن إضافة أكثر من 15 قسماً فرعياً داخل القسم الواحد.",
  });
});
// Main sections and subcategories.
test("a main section with subcategories cannot be deleted until they are removed", () => {
  const r = deleteRule({ categoryCount: 9, productCount: 0, childCount: 2, targetId: null, sourceId: "a" });
  assert.deepEqual(r, { ok: false, message: "هذا القسم فيه 2 أقسام فرعية. احذفها أولاً." });
});
test("subcategories are listed under their main section, and coverage includes them", () => {
  const cats = [
    { id: "m", parent_id: null },
    { id: "s1", parent_id: "m" },
    { id: "s2", parent_id: "m" },
    { id: "other", parent_id: null },
  ] as const;
  const all = cats.map((c) => ({ ...c })) as unknown as Parameters<typeof mainSections>[0];
  assert.deepEqual(mainSections(all).map((c) => c.id), ["m", "other"]);
  assert.deepEqual(subcategoriesOf(all, "m").map((c) => c.id), ["s1", "s2"]);
  assert.equal(isLeaf(all, "m"), false);
  assert.equal(isLeaf(all, "s1"), true);
  assert.deepEqual([...coverage(all, "m")].sort(), ["m", "s1", "s2"]);
  assert.deepEqual([...coverage(all, "s1")], ["s1"]);
});
test("create payload carries the parent; the edit payload cannot change it", () => {
  const base = { name_ar: "الغسول", description_ar: "", image_path: "", accent: ACCENT_PALETTE[0], is_visible: true };
  const parentId = "00000000-0000-4000-8000-0000000000c1";
  assert.equal(categoryCreateSchema.parse({ ...base, parent_id: parentId }).parent_id, parentId);
  assert.equal(categoryCreateSchema.parse({ ...base }).parent_id, null);
  const edited = categoryUpdateSchema.parse({ id: parentId, ...base, parent_id: "00000000-0000-4000-8000-0000000000c9" });
  assert.equal("parent_id" in edited, false);
});
// Arabic plural helper and price bands.
test("product counts follow the Arabic agreement rules, with Western digits", () => {
  assert.equal(productCount(0), "لا توجد منتجات");
  assert.equal(productCount(1), "منتج واحد");
  assert.equal(productCount(2), "منتجان");
  assert.equal(productCount(3), "3 منتجات");
  assert.equal(productCount(10), "10 منتجات");
  assert.equal(productCount(11), "11 منتجاً");
  assert.equal(productCount(100), "100 منتجاً");
});
test("price bands with no products are hidden", () => {
  const bands = [
    { label: "أ", count: 2 },
    { label: "ب", count: 0 },
    { label: "ج", count: 1 },
  ];
  assert.deepEqual(nonEmptyPriceBands(bands).map((b) => b.label), ["أ", "ج"]);
});
test("demo categories use the four palette colors and valid slugs", () => {
  for (const c of demoCategories) {
    assert.ok((ACCENT_PALETTE as readonly string[]).includes(c.accent));
    assert.match(c.slug, /^[a-z0-9-]{2,40}$/);
  }
  assert.deepEqual(demoCategories.map((c) => c.slug), [
    "skin-care",
    "skin-cleanser",
    "skin-serum",
    "skin-moisturizer",
    "hair-care",
    "sun-care",
    "cosmetics",
  ]);
  // Every subcategory points at a main section that is in the list.
  for (const c of demoCategories)
    if (c.parent_id) assert.ok(demoCategories.some((p) => p.id === c.parent_id && p.parent_id === null));
});
