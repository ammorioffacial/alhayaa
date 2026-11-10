import "server-only";
import { configured, supabase } from "./supabase";
import { demoCategories, demoProducts } from "./demo";
import type { Category, Product } from "./catalog";
// Embedded category: visitors only receive visible categories (categories RLS), so products in
// hidden categories come back with category = null and are not shown on the storefront.
export const PRODUCT_SELECT =
  "*, category:categories(id,name_ar,slug,description_ar,image_path,accent,sort_order,is_visible)";
/** Storefront data: products plus the visible categories, ordered by sort_order. */
export async function getStorefrontData(): Promise<{
  products: Product[];
  categories: Category[];
  demo: boolean;
}> {
  if (!configured()) {
    if (process.env.DEMO_MODE === "true")
      return { products: demoProducts, categories: demoCategories, demo: true };
    return { products: [], categories: [], demo: false };
  }
  const db = await supabase();
  const [products, categories] = await Promise.all([
    db.from("products").select(PRODUCT_SELECT).order("created_at", { ascending: false }),
    db.from("categories").select("*").eq("is_visible", true).order("sort_order", { ascending: true }),
  ]);
  if (products.error || categories.error)
    throw new Error("تعذر تحميل المنتجات. يرجى المحاولة لاحقاً.");
  return {
    products: (products.data ?? []) as Product[],
    categories: (categories.data ?? []) as Category[],
    demo: false,
  };
}
/** Products only (used by the checkout route to re-check prices and availability). */
export async function getProducts(): Promise<{ products: Product[]; demo: boolean }> {
  const { products, demo } = await getStorefrontData();
  return { products, demo };
}
