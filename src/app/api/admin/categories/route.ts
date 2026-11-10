import { NextResponse } from "next/server";
import { z } from "zod";
import { adminClient, configured } from "@/lib/supabase";
import { sameOrigin } from "@/lib/request";
import {
  canAddCategory,
  categoryFieldsSchema,
  categoryUpdateSchema,
  CATEGORY_MESSAGES,
  deleteRule,
  generateSlug,
} from "@/lib/category-rules";
import type { Category } from "@/lib/catalog";
const fail = (error: string, status: number) => NextResponse.json({ error }, { status });
// Messages raised by the database (migrations 0001 and 0002) are Arabic and safe to show.
function dbMessage(error: { message?: string } | null) {
  return error?.message && /[\u0600-\u06FF]/.test(error.message)
    ? error.message
    : "تعذر حفظ التغيير. حاول مجدداً.";
}
/** Shared checks: same origin, configured, and an admin session. Returns the admin client or a response. */
async function guard(req: Request) {
  if (!sameOrigin(req)) return fail("طلب غير مسموح", 403);
  if (!configured()) return fail("غير مصرح", 401);
  const db = await adminClient();
  if (!db) return fail("غير مصرح", 401);
  return db;
}
/** Categories with their product counts (admins see hidden categories too). */
export async function GET(req: Request) {
  const db = await guard(req);
  if (!(db && "from" in db)) return db as NextResponse;
  const [categories, products] = await Promise.all([
    db.from("categories").select("*").order("sort_order", { ascending: true }),
    db.from("products").select("category_id"),
  ]);
  if (categories.error || products.error) return fail("تعذر تحميل التصنيفات.", 500);
  const counts: Record<string, number> = {};
  for (const p of products.data ?? [])
    if (p.category_id) counts[p.category_id] = (counts[p.category_id] ?? 0) + 1;
  return NextResponse.json({ categories: categories.data as Category[], counts });
}
export async function POST(req: Request) {
  const db = await guard(req);
  if (!(db && "from" in db)) return db as NextResponse;
  const parsed = categoryFieldsSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(parsed.error.issues[0].message, 400);
  const { count } = await db.from("categories").select("id", { count: "exact", head: true });
  const limit = canAddCategory(count ?? 0);
  if (!limit.ok) return fail(limit.message, 400);
  const existing = await db.from("categories").select("slug");
  if (existing.error) return fail("تعذر إنشاء التصنيف.", 500);
  const slug = generateSlug(new Set((existing.data ?? []).map((r) => r.slug)));
  const last = await db.from("categories").select("sort_order").order("sort_order", { ascending: false }).limit(1);
  const sort_order = (last.data?.[0]?.sort_order ?? 0) + 1;
  const { data, error } = await db
    .from("categories")
    .insert({ ...parsed.data, slug, sort_order })
    .select()
    .single();
  if (error) return fail(dbMessage(error), 400);
  return NextResponse.json({ category: data });
}
/** Edit: the slug is never in the payload, so it cannot change. */
export async function PUT(req: Request) {
  const db = await guard(req);
  if (!(db && "from" in db)) return db as NextResponse;
  const parsed = categoryUpdateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(parsed.error.issues[0].message, 400);
  const { id, ...fields } = parsed.data;
  const { data, error } = await db
    .from("categories")
    .update(fields)
    .eq("id", id)
    .select()
    .single();
  if (error) return fail(dbMessage(error), 400);
  return NextResponse.json({ category: data });
}
/** Reorder one step up or down (the database keeps sort_order consecutive). */
export async function PATCH(req: Request) {
  const db = await guard(req);
  if (!(db && "from" in db)) return db as NextResponse;
  const parsed = z
    .object({ id: z.string().uuid(), direction: z.enum(["up", "down"]) })
    .safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("طلب الترتيب غير صحيح.", 400);
  const { error } = await db.rpc("categories_move", {
    p_id: parsed.data.id,
    p_direction: parsed.data.direction,
  });
  if (error) return fail(dbMessage(error), 400);
  return NextResponse.json({ ok: true });
}
/**
 * Delete. The rule is checked here first (clear message), then the database function moves the
 * products and deletes the category in one transaction. If anything fails, nothing changes.
 */
export async function DELETE(req: Request) {
  const db = await guard(req);
  if (!(db && "from" in db)) return db as NextResponse;
  const parsed = z
    .object({ id: z.string().uuid(), target_id: z.string().uuid().nullable().optional() })
    .safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("طلب الحذف غير صحيح.", 400);
  const { id } = parsed.data;
  const target = parsed.data.target_id ?? null;
  const [categories, products] = await Promise.all([
    db.from("categories").select("id", { count: "exact", head: true }),
    db.from("products").select("id", { count: "exact", head: true }).eq("category_id", id),
  ]);
  const rule = deleteRule({
    categoryCount: categories.count ?? 0,
    productCount: products.count ?? 0,
    targetId: target,
    sourceId: id,
  });
  if (!rule.ok) return fail(rule.message, 400);
  const { data: moved, error } = await db.rpc("categories_delete", { p_id: id, p_target: target });
  if (error) return fail(dbMessage(error), 400);
  const n = typeof moved === "number" ? moved : rule.moved;
  return NextResponse.json({
    ok: true,
    moved: n,
    message: n > 0 ? CATEGORY_MESSAGES.deleted(n) : "تم حذف التصنيف.",
  });
}
