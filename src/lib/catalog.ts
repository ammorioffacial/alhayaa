import { z } from "zod";
import {
  GOVERNORATE_IDS,
  GOVERNORATE_NAMES,
  deliveryFee,
} from "@/lib/delivery";
/** A category row from the categories table (loaded from the database, never hardcoded). */
export type Category = {
  id: string;
  name_ar: string;
  slug: string;
  description_ar: string | null;
  image_path: string | null;
  accent: string;
  sort_order: number;
  is_visible: boolean;
};
export const productSchema = z.object({
  name: z.string().trim().min(2).max(150),
  brand: z.string().trim().min(1).max(80),
  category_id: z.string().uuid(),
  description: z.string().trim().min(5).max(3000),
  price: z.number().int().min(1).max(10000000),
  image_url: z
    .string()
    .max(1000)
    .refine(
      (v) =>
        v === "" ||
        /^https:\/\//.test(v) ||
        /^\/products\/[\w.-]+\.svg$/.test(v),
    ),
  available: z.boolean(),
  featured: z.boolean(),
  is_demo: z.boolean().default(false),
});
/** A product as the storefront and admin use it. `category` is embedded from the categories table. */
export type Product = z.infer<typeof productSchema> & {
  id: string;
  category: Category | null;
};
export type CartItem = {
  id: string;
  quantity: number;
  price: number;
  name: string;
};
/** WhatsApp message format (unchanged): Arabic-Indic digits and "د.ع". */
export const money = (n: number) =>
  `${new Intl.NumberFormat("ar-IQ").format(n)} د.ع`;
/** On-page price: Western digits and the ISO code, e.g. "24,000 IQD". */
export const formatPrice = (n: number) =>
  `${new Intl.NumberFormat("en-US").format(n)} IQD`;
export const checkoutSchema = z
  .object({
    customer: z.object({
      name: z.string().trim().min(2, "أدخل الاسم الكامل").max(100),
      phone: z
        .string()
        .trim()
        .regex(/^(?:07\d{9}|\+?9647\d{9})$/, "أدخل رقم هاتف عراقي صحيحاً"),
      governorate: z.enum(GOVERNORATE_IDS, { error: "اختر المحافظة" }),
      address: z.string().trim().min(8, "أدخل عنوان التوصيل بالتفصيل").max(500),
      notes: z.string().trim().max(1000).default(""),
    }),
    items: z
      .array(
        z.object({
          id: z.string().uuid(),
          quantity: z.number().int().min(1).max(99),
          price: z.number().int().positive(),
        }),
      )
      .min(1)
      .max(100),
  })
  .refine(
    (v) => new Set(v.items.map((i) => i.id)).size === v.items.length,
    "المنتجات مكررة",
  );
/**
 * A product can be ordered only while it is available and its category is present and visible.
 * Products in a hidden category, or with no category, are refused like unavailable products.
 * The explicit is_visible check gives the same answer for visitors and for signed-in admins.
 */
export function isOrderable(p: Product | undefined): boolean {
  return !!p && p.available && p.category?.is_visible === true;
}
export function reviewOrder(
  input: z.infer<typeof checkoutSchema>,
  products: Product[],
) {
  const changes: {
    id: string;
    name: string;
    price: number;
    available: boolean;
    message: string;
  }[] = [];
  const lines = input.items.map((item) => {
    const p = products.find((p) => p.id === item.id);
    if (!p || !isOrderable(p) || p.price !== item.price)
      changes.push({
        id: item.id,
        name: p?.name ?? "منتج محذوف",
        price: p?.price ?? item.price,
        available: isOrderable(p),
        message:
          !p || !isOrderable(p)
            ? "لم يعد المنتج متاحاً، يرجى حذفه للمتابعة."
            : `تغير السعر من ${formatPrice(item.price)} إلى ${formatPrice(p.price)}. راجع الطلب ثم أعد الإرسال.`,
      });
    return { p, quantity: item.quantity };
  });
  if (changes.length) return { changes, url: null };
  const total = lines.reduce((s, l) => s + l.p!.price * l.quantity, 0);
  const { customer: c } = input;
  const fee = deliveryFee(c.governorate);
  const message = [
    "طلب جديد — صيدلية حياة المجد",
    `الاسم: ${c.name}`,
    `الهاتف: ${c.phone}`,
    `المحافظة: ${GOVERNORATE_NAMES[c.governorate]}`,
    `عنوان التوصيل: ${c.address}`,
    "",
    ...lines.map(
      (l) =>
        `${l.p!.name} × ${l.quantity} | سعر القطعة: ${money(l.p!.price)} | المجموع: ${money(l.p!.price * l.quantity)}`,
    ),
    "",
    `إجمالي المنتجات: ${money(total)}`,
    `رسوم التوصيل: ${money(fee)}`,
    `الإجمالي: ${money(total + fee)}`,
    ...(c.notes ? [`ملاحظات: ${c.notes}`] : []),
    "يرجى تأكيد توفر المنتجات والطلب والتوصيل.",
  ].join("\n");
  return {
    changes: [],
    url: `https://wa.me/9647711191871?text=${encodeURIComponent(message)}`,
  };
}
