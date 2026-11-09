import { getProducts } from "@/lib/products";
import Store from "@/components/storefront/home";
export const dynamic = "force-dynamic";
export default async function Page() {
  const data = await getProducts().catch(() => ({
    products: [],
    demo: false,
    loadError: "تعذر تحميل المنتجات. يرجى تحديث الصفحة والمحاولة مجدداً.",
  }));
  return <Store {...data} />;
}
