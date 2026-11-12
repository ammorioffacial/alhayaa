import type { Category, Product } from "./catalog";
// Pure helpers for the two-level category tree (main sections and their subcategories).
// No database or network access, so they can be unit tested.
/** Main sections, in sort order. */
export function mainSections(categories: Category[]): Category[] {
  return categories.filter((c) => c.parent_id === null);
}
/** Subcategories of one main section, in sort order. */
export function subcategoriesOf(categories: Category[], parentId: string): Category[] {
  return categories.filter((c) => c.parent_id === parentId);
}
/** A leaf is any category that has no subcategories. Products may only belong to leaves. */
export function isLeaf(categories: Category[], id: string): boolean {
  return !categories.some((c) => c.parent_id === id);
}
/**
 * The category ids a selection covers. A main section covers itself and its subcategories;
 * a subcategory covers only itself.
 */
export function coverage(categories: Category[], id: string): Set<string> {
  const ids = new Set<string>([id]);
  for (const c of categories) if (c.parent_id === id) ids.add(c.id);
  return ids;
}
/** Products whose category is covered by the selection. */
export function productsIn(products: Product[], categories: Category[], id: string): Product[] {
  const ids = coverage(categories, id);
  return products.filter((p) => p.category !== null && ids.has(p.category.id));
}
/** A readable label: the main section's name, then the subcategory's name (joined with a separator). */
export function labelOf(categories: Category[], c: Category): string {
  const parent = c.parent_id ? categories.find((p) => p.id === c.parent_id) : undefined;
  return parent ? `${parent.name_ar} › ${c.name_ar}` : c.name_ar;
}
