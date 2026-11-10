import { test, expect } from "@playwright/test";
// Live Supabase test project only. Needs LIVE_ADMIN_EMAIL and LIVE_ADMIN_PASSWORD; skipped otherwise.
test("admin adds a category, assigns a product, hides it, and deletes it with a target", async ({ page }) => {
  test.skip(
    !process.env.LIVE_ADMIN_EMAIL || !process.env.LIVE_ADMIN_PASSWORD,
    "Requires a configured test Supabase project and admin credentials.",
  );
  const label = `تصنيف اختبار ${Date.now()}`;
  const productName = `منتج تصنيف ${Date.now()}`;
  // Sign in.
  await page.goto("/admin/login");
  await page.getByLabel("البريد الإلكتروني").fill(process.env.LIVE_ADMIN_EMAIL!);
  await page.getByLabel("كلمة المرور").fill(process.env.LIVE_ADMIN_PASSWORD!);
  await page.getByRole("button", { name: "تسجيل الدخول", exact: true }).click();
  await page.waitForURL("**/admin");
  // Add a category with a description and no image.
  await page.goto("/admin/categories");
  await page.getByRole("button", { name: "إضافة تصنيف" }).click();
  await page.getByLabel("اسم التصنيف").fill(label);
  await page.getByLabel("وصف قصير (اختياري، حتى 120 حرفاً)").fill("وصف تجريبي للتصنيف");
  await page.getByRole("button", { name: "حفظ التصنيف" }).click();
  const row = page.getByRole("row").filter({ hasText: label });
  await expect(row).toBeVisible();
  await expect(row.locator("code")).toHaveText(/^c[a-z0-9]{6}$/);
  // Assign a new product to it from the product form.
  await page.goto("/admin");
  await page.getByRole("button", { name: "إضافة منتج" }).click();
  await page.getByLabel("اسم المنتج", { exact: true }).fill(productName);
  await page.getByLabel("الماركة").fill("AUTOMATED TEST");
  await page.getByLabel("السعر بالدينار العراقي").fill("1000");
  await page.getByLabel("وصف المنتج").fill("منتج مؤقت لاختبار التصنيفات فقط");
  await page.getByLabel("التصنيف", { exact: true }).selectOption({ label });
  await page.getByRole("button", { name: "حفظ المنتج" }).click();
  await expect(page.getByRole("row").filter({ hasText: productName })).toContainText(label);
  // Storefront: the category appears in the filter row with its count.
  await page.goto("/");
  const card = page.locator(".sf-categories").getByRole("button", { name: label, exact: true });
  await expect(card).toContainText("منتج واحد");
  // Hide it: it leaves the storefront but stays in the admin list.
  await page.goto("/admin/categories");
  await page.getByRole("button", { name: `إخفاء ${label}` }).click();
  await expect(page.getByRole("row").filter({ hasText: label })).toContainText("مخفي");
  await page.goto("/");
  await expect(page.locator(".sf-categories").getByRole("button", { name: label, exact: true })).toHaveCount(0);
  // Delete it with a target: the product moves and the category is removed.
  await page.goto("/admin/categories");
  await page.getByRole("button", { name: `حذف ${label}` }).click();
  await expect(page.getByText("نقل المنتجات إلى")).toBeVisible();
  await page.getByRole("button", { name: "تأكيد الحذف" }).click();
  await expect(page.getByText(/تم حذف التصنيف ونقل 1 منتجات\./)).toBeVisible();
  await expect(page.getByRole("row").filter({ hasText: label })).toHaveCount(0);
});
