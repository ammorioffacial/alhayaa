import { getStorefrontData } from "@/lib/products";
import { availableHeroVideos } from "@/lib/hero-media.server";
import Store from "@/components/storefront/home";
export const dynamic = "force-dynamic";
export default async function Page() {
  const data = await getStorefrontData().catch(() => ({
    products: [],
    categories: [],
    demo: false,
    loadError: "تعذر تحميل المنتجات. يرجى تحديث الصفحة والمحاولة مجدداً.",
  }));
  return <Store {...data} heroVideos={availableHeroVideos()} />;
}
