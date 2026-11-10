import { test, expect } from "@playwright/test";
// Demo mode: the storefront reads the demo categories fixture. Admin category flows are in
// categories-live.spec.ts (they need a real admin login).
test("storefront category row shows the demo categories, and filtering narrows the catalog", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".sf-product")).toHaveCount(6);
  const row = page.locator(".sf-categories");
  for (const name of ["العناية بالبشرة", "العناية بالشعر", "واقيات الشمس", "مستحضرات التجميل"]) {
    await expect(row.getByRole("button", { name, exact: true })).toBeVisible();
  }
  await row.getByRole("button", { name: "العناية بالشعر", exact: true }).click();
  await expect(page.locator(".sf-product")).toHaveCount(1);
  await expect(page.locator(".sf-product")).toContainText("شامبو العناية بالشعر");
});
test("category counts are Arabic plural phrases with Western digits", async ({ page }) => {
  await page.goto("/");
  const skin = page.locator(".sf-categories").getByRole("button", { name: "العناية بالبشرة", exact: true });
  await expect(skin).toContainText("3 منتجات");
  const hair = page.locator(".sf-categories").getByRole("button", { name: "العناية بالشعر", exact: true });
  await expect(hair).toContainText("منتج واحد");
});
