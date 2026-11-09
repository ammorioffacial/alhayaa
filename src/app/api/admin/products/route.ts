import { NextResponse } from "next/server";
import { adminClient, configured } from "@/lib/supabase";
import { productSchema } from "@/lib/catalog";
import { z } from "zod";
import { sameOrigin } from "@/lib/request";
async function mutate(req: Request, method: "POST" | "PUT" | "DELETE") {
  if (!sameOrigin(req))
    return NextResponse.json({ error: "طلب غير مسموح" }, { status: 403 });
  if (!configured())
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  try {
    const db = await adminClient();
    if (!db) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    const body = await req.json();
    if (method !== "POST" && !z.string().uuid().safeParse(body.id).success)
      return NextResponse.json({ error: "معرف غير صحيح" }, { status: 400 });
    if (method === "DELETE") {
      const { error } = await db.from("products").delete().eq("id", body.id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }
    const parsed = productSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json(
        {
          error:
            "راجع حقول المنتج: الاسم والوصف والسعر والصورة مطلوبة بصيغة صحيحة.",
        },
        { status: 400 },
      );
    const query =
      method === "POST"
        ? db.from("products").insert(parsed.data)
        : db.from("products").update(parsed.data).eq("id", body.id);
    const { data, error } = await query.select().single();
    if (error) throw error;
    return NextResponse.json({ product: data });
  } catch {
    return NextResponse.json(
      { error: "تعذر حفظ التغيير. حاول مجدداً." },
      { status: 500 },
    );
  }
}
export const POST = (r: Request) => mutate(r, "POST");
export const PUT = (r: Request) => mutate(r, "PUT");
export const DELETE = (r: Request) => mutate(r, "DELETE");
