import { redirect } from "next/navigation";
import { adminClient, configured } from "@/lib/supabase";
import Admin from "@/components/admin";
import type { Product } from "@/lib/catalog";
export const dynamic = "force-dynamic";
export default async function Page() {
  if (!configured()) redirect("/admin/login");
  const db = await adminClient();
  if (!db) redirect("/admin/login");
  const { data, error } = await db
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });
  return (
    <Admin
      initial={(data ?? []) as Product[]}
      loadError={error ? "تعذر تحميل المنتجات. أعد تحميل الصفحة." : ""}
    />
  );
}
