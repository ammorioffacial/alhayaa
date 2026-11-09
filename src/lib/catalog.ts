import { z } from "zod";
export const categories = [
  "العناية بالبشرة",
  "العناية بالشعر",
  "واقيات الشمس",
  "مستحضرات التجميل",
] as const;
export const productSchema = z.object({
  name: z.string().trim().min(2).max(150),
  brand: z.string().trim().min(1).max(80),
  category: z.enum(categories),
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
export type Product = z.infer<typeof productSchema> & { id: string };
export type CartItem = {
  id: string;
  quantity: number;
  price: number;
  name: string;
};
export const money = (n: number) =>
  `${new Intl.NumberFormat("ar-IQ").format(n)} د.ع`;
export const checkoutSchema = z
  .object({
    customer: z.object({
      name: z.string().trim().min(2, "أدخل الاسم الكامل").max(100),
      phone: z
        .string()
        .trim()
        .regex(/^(?:07\d{9}|\+?9647\d{9})$/, "أدخل رقم هاتف عراقي صحيحاً"),
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
    if (!p || !p.available || p.price !== item.price)
      changes.push({
        id: item.id,
        name: p?.name ?? "منتج محذوف",
        price: p?.price ?? item.price,
        available: !!p?.available,
        message:
          !p || !p.available
            ? "لم يعد المنتج متاحاً، يرجى حذفه للمتابعة."
            : `تغير السعر من ${money(item.price)} إلى ${money(p.price)}. راجع الطلب ثم أعد الإرسال.`,
      });
    return { p, quantity: item.quantity };
  });
  if (changes.length) return { changes, url: null };
  const total = lines.reduce((s, l) => s + l.p!.price * l.quantity, 0);
  const { customer: c } = input;
  const message = [
    "طلب جديد — صيدلية حياة المجد",
    `الاسم: ${c.name}`,
    `الهاتف: ${c.phone}`,
    `عنوان التوصيل: ${c.address}`,
    "",
    ...lines.map(
      (l) =>
        `${l.p!.name} × ${l.quantity} | سعر القطعة: ${money(l.p!.price)} | المجموع: ${money(l.p!.price * l.quantity)}`,
    ),
    "",
    `إجمالي المنتجات: ${money(total)}`,
    "رسوم التوصيل تُؤكد عبر واتساب.",
    ...(c.notes ? [`ملاحظات: ${c.notes}`] : []),
    "يرجى تأكيد توفر المنتجات والطلب والتوصيل.",
  ].join("\n");
  return {
    changes: [],
    url: `https://wa.me/9647711191871?text=${encodeURIComponent(message)}`,
  };
}
