import { NextResponse } from "next/server";
import { adminClient, configured } from "@/lib/supabase";
import { sameOrigin } from "@/lib/request";
export async function POST(req: Request) {
  if (!sameOrigin(req))
    return NextResponse.json({ error: "طلب غير مسموح" }, { status: 403 });
  if (!configured())
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  try {
    const db = await adminClient();
    if (!db) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    if (Number(req.headers.get("content-length")) > 6 * 1024 * 1024)
      return NextResponse.json(
        { error: "حجم الصورة يتجاوز 5 ميغابايت" },
        { status: 400 },
      );
    const file = (await req.formData()).get("file");
    if (
      !(file instanceof File) ||
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 5 * 1024 * 1024 ||
      !file.size
    )
      return NextResponse.json(
        { error: "اختر صورة JPG أو PNG أو WebP لا تتجاوز 5 ميغابايت." },
        { status: 400 },
      );
    const bytes = new Uint8Array(await file.arrayBuffer());
    const valid =
      file.type === "image/jpeg"
        ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
        : file.type === "image/png"
          ? bytes.slice(0, 8).join(",") === "137,80,78,71,13,10,26,10"
          : new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" &&
            new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP";
    if (!valid)
      return NextResponse.json(
        { error: "محتوى الملف لا يطابق نوع الصورة." },
        { status: 400 },
      );
    const path = `${crypto.randomUUID()}.${file.type.split("/")[1]}`;
    const { error } = await db.storage
      .from("product-images")
      .upload(path, bytes, { contentType: file.type, upsert: false });
    if (error) throw error;
    return NextResponse.json({
      url: db.storage.from("product-images").getPublicUrl(path).data.publicUrl,
    });
  } catch {
    return NextResponse.json(
      { error: "تعذر رفع الصورة. تحقق من إعداد التخزين ثم حاول مجدداً." },
      { status: 500 },
    );
  }
}
