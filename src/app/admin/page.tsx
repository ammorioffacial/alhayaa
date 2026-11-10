import { redirect } from "next/navigation";
import { adminClient, configured } from "@/lib/supabase";
import { PRODUCT_SELECT } from "@/lib/products";
import Admin from "@/components/admin";
import type { Category, Product } from "@/lib/catalog";
export const dynamic = "force-dynamic";
export default async function Page() {
  if (!configured()) redirect("/admin/login");
  const db = await adminClient();
  if (!db) redirect("/admin/login");
  // Admins read every category, including hidden ones (categories RLS).
  const [products, categories] = await Promise.all([
    db.from("products").select(PRODUCT_SELECT).order("created_at", { ascending: false }),
    db.from("categories").select("*").order("sort_order", { ascending: true }),
  ]);
  return (
    <Admin
      initial={(products.data ?? []) as Product[]}
      categories={(categories.data ?? []) as Category[]}
      loadError={products.error || categories.error ? "تعذر تحميل البيانات. أعد تحميل الصفحة." : ""}
    />
  );
}
