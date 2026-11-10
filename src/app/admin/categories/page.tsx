import { redirect } from "next/navigation";
import { adminClient, configured } from "@/lib/supabase";
import AdminCategories from "@/components/admin-categories";
import type { Category } from "@/lib/catalog";
export const dynamic = "force-dynamic";
export default async function Page() {
  if (!configured()) redirect("/admin/login");
  const db = await adminClient();
  if (!db) redirect("/admin/login");
  const [categories, products] = await Promise.all([
    db.from("categories").select("*").order("sort_order", { ascending: true }),
    db.from("products").select("category_id"),
  ]);
  const counts: Record<string, number> = {};
  for (const p of products.data ?? [])
    if (p.category_id) counts[p.category_id] = (counts[p.category_id] ?? 0) + 1;
  return (
    <AdminCategories
      initial={(categories.data ?? []) as Category[]}
      initialCounts={counts}
      loadError={categories.error || products.error ? "تعذر تحميل التصنيفات. أعد تحميل الصفحة." : ""}
    />
  );
}
