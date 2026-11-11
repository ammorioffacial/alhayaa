import { test, expect } from "@playwright/test";
test("live Supabase admin CRUD, image upload, authoritative checkout and logout", async ({
  page,
  request,
}) => {
  test.skip(
    !process.env.LIVE_ADMIN_EMAIL || !process.env.LIVE_ADMIN_PASSWORD,
    "Requires a configured test Supabase project and admin credentials.",
  );
  const name = `اختبار آلي ${Date.now()}`;
  await page.goto("/admin/login");
  await page
    .getByLabel("البريد الإلكتروني")
    .fill(process.env.LIVE_ADMIN_EMAIL!);
  await page.getByLabel("كلمة المرور").fill(process.env.LIVE_ADMIN_PASSWORD!);
  await page.getByRole("button", { name: "تسجيل الدخول", exact: true }).click();
  await expect(page).toHaveURL(/\/admin$/);
  let id = "";
  try {
    await page.getByRole("button", { name: "إضافة منتج" }).click();
    await page.getByLabel("اسم المنتج", { exact: true }).fill(name);
    await page.getByLabel("الماركة").fill("AUTOMATED TEST");
    await page.getByLabel("السعر بالدينار العراقي").fill("1000");
    await page
      .getByLabel("وصف المنتج")
      .fill("منتج مؤقت لاختبار تكامل النظام فقط");
    await page.getByLabel("صورة المنتج").setInputFiles({
      name: "test.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jH3sAAAAASUVORK5CYII=",
        "base64",
      ),
    });
    await expect(page.getByAltText("معاينة صورة المنتج")).toBeVisible();
    const saved = page.waitForResponse(
      (r) =>
        r.url().endsWith("/api/admin/products") &&
        r.request().method() === "POST",
    );
    await page.getByRole("button", { name: "حفظ المنتج" }).click();
    const result = await (await saved).json();
    id = result.product.id;
    await expect(page.getByRole("row").filter({ hasText: name })).toBeVisible();
    await page
      .getByRole("row")
      .filter({ hasText: name })
      .getByRole("button", { name: "تعديل" })
      .click();
    await page.getByLabel("السعر بالدينار العراقي").fill("1500");
    await page.getByRole("button", { name: "حفظ المنتج" }).click();
    await expect(page.getByRole("row").filter({ hasText: name })).toContainText(
      "1,500 IQD",
    );
    const order = {
      customer: {
        name: "اختبار آلي",
        phone: "07711191871",
        address: "عنوان اختبار غير حقيقي",
        notes: "",
      },
      items: [{ id, price: 1000, quantity: 2 }],
    };
    const stale = await request.post("/api/checkout", { data: order });
    expect(stale.status()).toBe(409);
    const fresh = await request.post("/api/checkout", {
      data: { ...order, items: [{ id, price: 1500, quantity: 2 }] },
    });
    expect(fresh.status()).toBe(200);
    expect(
      new URL((await fresh.json()).url).searchParams.get("text"),
    ).toContain("٣٬٠٠٠");
    await page.goto("/");
    await page.getByRole("textbox", { name: "البحث عن المنتجات" }).fill(name);
    await page.getByRole("button", { name: `أضف ${name} للسلة` }).click();
    await page
      .locator(".sf-desktop-nav")
      .getByRole("button", { name: "السلة، 1 قطع" })
      .click();
    await page.getByLabel("الاسم الكامل").fill("اختبار آلي");
    await page.getByLabel("رقم الهاتف").fill("07711191871");
    await page.getByLabel("عنوان التوصيل").fill("عنوان اختبار غير حقيقي");
    await page.getByLabel("المحافظة", { exact: true }).selectOption("baghdad");
    await page.route("https://wa.me/**", (route) => route.abort());
    const navigation = page.waitForRequest((r) =>
      r.url().startsWith("https://wa.me/"),
    );
    await page.getByRole("button", { name: "أرسل الطلب على واتساب" }).click();
    expect(
      new URL((await navigation).url()).searchParams.get("text"),
    ).toContain(name);
    await page.goto("/");
    await expect(
      page
        .locator(".sf-desktop-nav")
        .getByRole("button", { name: "السلة، 1 قطع" }),
    ).toBeVisible();
  } finally {
    if (id) {
      await page.goto("/admin");
      page.once("dialog", (dialog) => dialog.accept());
      await page
        .getByRole("row")
        .filter({ hasText: name })
        .getByRole("button", { name: "حذف" })
        .click();
      await expect(page.getByRole("row").filter({ hasText: name })).toHaveCount(
        0,
      );
    }
  }
  await page.getByRole("button", { name: "تسجيل الخروج" }).click();
  await expect(page).toHaveURL(/\/admin\/login/);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
});
