import { NextResponse } from "next/server";
import { checkoutSchema, reviewOrder } from "@/lib/catalog";
import { getProducts } from "@/lib/products";
import { configured } from "@/lib/supabase";
export async function POST(req: Request) {
  try {
    const input = checkoutSchema.safeParse(await req.json());
    if (!input.success)
      return NextResponse.json(
        { error: input.error.issues[0].message },
        { status: 400 },
      );
    if (!configured())
      return NextResponse.json(
        {
          error:
            "هذه معاينة تجريبية. يتطلب إرسال طلب حقيقي ربط قاعدة بيانات الصيدلية.",
        },
        { status: 503 },
      );
    const { products } = await getProducts();
    if (
      input.data.items.some((i) => products.find((p) => p.id === i.id)?.is_demo)
    )
      return NextResponse.json(
        { error: "احذف المنتجات التجريبية من السلة قبل إرسال طلب حقيقي." },
        { status: 400 },
      );
    const result = reviewOrder(input.data, products);
    return NextResponse.json(result, {
      status: result.changes.length ? 409 : 200,
    });
  } catch {
    return NextResponse.json(
      { error: "تعذر التحقق من الطلب. لم يُرسل أي طلب؛ حاول مجدداً." },
      { status: 500 },
    );
  }
}
