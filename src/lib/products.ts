import "server-only";
import { configured, supabase } from "./supabase";
import { demoProducts } from "./demo";
import type { Product } from "./catalog";
export async function getProducts(): Promise<{
  products: Product[];
  demo: boolean;
}> {
  if (!configured()) {
    if (process.env.DEMO_MODE === "true")
      return { products: demoProducts, demo: true };
    return { products: [], demo: false };
  }
  const db = await supabase();
  const { data, error } = await db
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error("تعذر تحميل المنتجات. يرجى المحاولة لاحقاً.");
  return { products: data as Product[], demo: false };
}
