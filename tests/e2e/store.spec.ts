import { test, expect } from "@playwright/test";
test("mobile catalog, search, details, cart persistence and WhatsApp preview", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "مختارات الصيدلية" }),
  ).toBeVisible();
  await page.setViewportSize({ width: 320, height: 740 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/mobile-store.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 360, height: 780 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("textbox", { name: "البحث عن المنتجات" }).fill("غسول");
  await expect(page.locator(".product-card")).toHaveCount(1);
  await page.getByRole("button", { name: "تفاصيل غسول الوجه المرطب" }).click();
  await expect(page.getByRole("dialog")).toContainText("HAYAT CARE");
  await page
    .getByRole("button", { name: "أضف إلى السلة", exact: true })
    .click();
  await page.getByRole("button", { name: "إغلاق", exact: true }).click();
  await page.reload();
  await page
    .locator(".sf-bottom-nav")
    .getByRole("button", { name: "السلة، 1 قطع" })
    .click();
  await page.getByRole("button", { name: "زيادة غسول الوجه المرطب" }).click();
  await page.getByLabel("الاسم الكامل").fill("زبون تجريبي");
  await page.getByLabel("رقم الهاتف").fill("07711191871");
  await page.getByLabel("عنوان التوصيل").fill("بغداد، حي الجامعة، شارع ٦٦");
  await page.getByLabel("ملاحظات (اختياري)").fill("الاتصال قبل الوصول");
  await page.getByRole("button", { name: "أرسل الطلب على واتساب" }).click();
  await expect(page.locator(".message-preview")).toContainText("× 2");
  await expect(page.locator(".message-preview")).toContainText("٤٨٬٠٠٠");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/mobile-cart.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "حذف غسول الوجه المرطب" }).click();
  await expect(page.getByText("سلّتك تنتظر اختياراتك")).toBeVisible();
});
test("category filtering, unavailable state, empty results and desktop layout", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await expect(page.locator(".product-card")).toHaveCount(6);
  await page
    .locator(".product-image img")
    .first()
    .evaluate(async (img: HTMLImageElement) => {
      await img.decode();
    });
  await page.screenshot({
    path: "test-results/desktop-store.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "مستحضرات التجميل", exact: true })
    .click();
  await expect(page.locator(".product-card")).toHaveCount(1);
  await expect(
    page.getByRole("button", { name: "أضف تينت الشفاه الوردي للسلة" }),
  ).toBeDisabled();
  await page
    .getByRole("textbox", { name: "البحث عن المنتجات" })
    .fill("لا يوجد");
  await expect(page.getByText("لا توجد منتجات حالياً")).toBeVisible();
});
test("anonymous admin requests denied and dashboard redirects to login", async ({
  request,
  page,
}) => {
  for (const method of ["POST", "PUT", "DELETE"]) {
    const r = await request.fetch("/api/admin/products", {
      method,
      headers: { origin: "http://127.0.0.1:3000" },
      data: {},
    });
    expect(r.status()).toBe(401);
  }
  const upload = await request.post("/api/admin/upload", {
    headers: { origin: "http://127.0.0.1:3000" },
  });
  expect(upload.status()).toBe(401);
  const crossSite = await request.post("/api/admin/products", {
    headers: { origin: "https://untrusted.example" },
    data: {},
  });
  expect(crossSite.status()).toBe(403);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
  await expect(
    page.getByRole("heading", { name: "أهلاً دكتور" }),
  ).toBeVisible();
});
