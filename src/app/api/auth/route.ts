import { NextResponse } from "next/server";
import { supabase, configured, adminClient } from "@/lib/supabase";
import { sameOrigin } from "@/lib/request";
export async function POST(req: Request) {
  if (!sameOrigin(req))
    return NextResponse.json({ error: "طلب غير مسموح" }, { status: 403 });
  if (!configured())
    return NextResponse.json(
      { error: "يرجى إعداد Supabase أولاً حسب README." },
      { status: 503 },
    );
  try {
    const { email, password } = await req.json();
    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      email.length > 254 ||
      password.length > 200
    )
      return NextResponse.json({ error: "بيانات غير صحيحة" }, { status: 400 });
    const db = await supabase();
    const { error } = await db.auth.signInWithPassword({ email, password });
    if (error || !(await adminClient())) {
      await db.auth.signOut();
      return NextResponse.json(
        { error: "بيانات الدخول غير صحيحة أو الحساب غير مصرح له." },
        { status: 401 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "تعذر تسجيل الدخول. حاول لاحقاً." },
      { status: 500 },
    );
  }
}
export async function DELETE(req: Request) {
  if (!sameOrigin(req))
    return NextResponse.json({ error: "طلب غير مسموح" }, { status: 403 });
  if (!configured())
    return NextResponse.json(
      { error: "لم يتم إعداد Supabase" },
      { status: 503 },
    );
  const db = await supabase();
  await db.auth.signOut();
  return NextResponse.json({ ok: true });
}
