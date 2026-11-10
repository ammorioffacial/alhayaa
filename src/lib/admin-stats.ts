import type { Category, Product } from "./catalog";
// Pure statistics for the admin dashboard, computed from the catalog only.
// Orders and searches are not tracked yet, so this module does not report them.
export const priceBands = [
  { label: "أقل من 20,000", min: 0, max: 19999 },
  { label: "20,000 – 29,999", min: 20000, max: 29999 },
  { label: "30,000 – 39,999", min: 30000, max: 39999 },
  { label: "40,000 فأكثر", min: 40000, max: Infinity },
] as const;
export type AdminStats = {
  total: number;
  available: number;
  unavailable: number;
  featured: number;
  demo: number;
  withoutImage: number;
  averagePrice: number;
  minPrice: number;
  maxPrice: number;
  byCategory: { name: string; count: number }[];
  priceBands: { label: string; count: number }[];
  topPriced: { id: string; name: string; price: number }[];
  needsAttention: { id: string; name: string; reason: string }[];
};
/** Keeps only the price bands that have at least one product. */
export function nonEmptyPriceBands<T extends { count: number }>(bands: T[]): T[] {
  return bands.filter((b) => b.count > 0);
}
export function computeAdminStats(products: Product[], categories: Category[]): AdminStats {
  const total = products.length;
  const prices = products.map((p) => p.price);
  const sum = prices.reduce((a, b) => a + b, 0);
  return {
    total,
    available: products.filter((p) => p.available).length,
    unavailable: products.filter((p) => !p.available).length,
    featured: products.filter((p) => p.featured).length,
    demo: products.filter((p) => p.is_demo).length,
    withoutImage: products.filter((p) => !p.image_url).length,
    averagePrice: total ? Math.round(sum / total) : 0,
    minPrice: total ? Math.min(...prices) : 0,
    maxPrice: total ? Math.max(...prices) : 0,
    // Every category from the table, including ones with zero products.
    byCategory: categories.map((c) => ({
      name: c.name_ar,
      count: products.filter((p) => p.category_id === c.id).length,
    })),
    priceBands: priceBands.map((band) => ({
      label: band.label,
      count: products.filter((p) => p.price >= band.min && p.price <= band.max).length,
    })),
    topPriced: [...products]
      .sort((a, b) => b.price - a.price)
      .slice(0, 5)
      .map((p) => ({ id: p.id, name: p.name, price: p.price })),
    needsAttention: [
      ...products
        .filter((p) => !p.available)
        .map((p) => ({ id: p.id, name: p.name, reason: "غير متوفر للطلب" })),
      ...products
        .filter((p) => !p.image_url)
        .map((p) => ({ id: p.id, name: p.name, reason: "بلا صورة" })),
    ].slice(0, 6),
  };
}
