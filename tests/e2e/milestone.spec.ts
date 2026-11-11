import { test, expect } from "@playwright/test";

async function noOverflow(page: import("@playwright/test").Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}

test("390px milestone: campaign, navigation, product cards, persisted cart and order message", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator(".sf-product")).toHaveCount(6);
  await page.evaluate(() => document.fonts.ready);
  await page
    .locator(".sf-category-art img")
    .first()
    .evaluate((img: HTMLImageElement) => img.decode());
  expect(
    (await page.locator(".sf-product").first().boundingBox())!.y,
  ).toBeLessThan(1100);
  await page.screenshot({ path: "artifacts/review/home-390.png" });
  await page.screenshot({
    path: "artifacts/review/home-390-full.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "تسوّقي المجموعة", exact: true })
    .click();
  await expect(page.locator(".sf-product")).toHaveCount(1);
  await expect(page.locator(".sf-product")).toContainText("واقي الشمس اليومي");
  await expect(
    page.getByRole("button", { name: "واقيات الشمس", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .locator(".sf-bottom-nav")
    .getByRole("button", { name: "الرئيسية", exact: true })
    .click();
  await expect(page.locator(".sf-product")).toHaveCount(6);
  // Search is no longer in the dock; focus the header search field directly.
  await page.getByRole("textbox", { name: "البحث عن المنتجات" }).click();
  await expect(
    page.getByRole("textbox", { name: "البحث عن المنتجات" }),
  ).toBeFocused();
  await page.getByRole("textbox", { name: "البحث عن المنتجات" }).fill("HAYAT");
  await expect(page.locator(".sf-product")).toHaveCount(2);
  await page.getByRole("button", { name: "مسح البحث" }).click();
  await page.evaluate(() => window.scrollTo(0, 310));
  await page.screenshot({ path: "artifacts/review/products-390.png" });
  await page
    .getByRole("button", { name: "أضف غسول الوجه المرطب للسلة" })
    .click();
  await expect(page.locator(".sf-toast")).toContainText("أُضيف");
  await page
    .getByRole("button", { name: "أضف سيروم العناية بالبشرة للسلة" })
    .click();
  await page.reload();
  await page
    .locator(".sf-bottom-nav")
    .getByRole("button", { name: "السلة، 2 قطع" })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "زيادة غسول الوجه المرطب" }).click();
  await expect(page.locator(".sf-cart-summary")).toContainText("80,000 IQD");
  await expect(page.locator(".sf-cart-thumbnail img")).toHaveCount(2);
  await page.screenshot({ path: "artifacts/review/cart-390.png" });
  const summary = await page.locator(".sf-cart-summary").boundingBox();
  expect(summary!.y + summary!.height).toBeLessThanOrEqual(845);
  await page.getByLabel("الاسم الكامل").fill("زبون تجريبي");
  await page.getByLabel("رقم الهاتف").fill("07711191871");
  await page.getByLabel("عنوان التوصيل").fill("بغداد، حي الجامعة، شارع ٦٦");
  await page.getByLabel("المحافظة", { exact: true }).selectOption("baghdad");
  await page.getByLabel("ملاحظات (اختياري)").fill("الاتصال قبل الوصول");
  await page.getByRole("button", { name: "أرسل الطلب على واتساب" }).click();
  const preview = page.locator(".sf-message-preview");
  await expect(preview).toContainText("غسول الوجه المرطب × 2");
  await expect(preview).toContainText("٨٠٬٠٠٠");
  const url = new URL((await preview.getAttribute("data-whatsapp-url"))!);
  expect(url.origin + url.pathname).toBe("https://wa.me/9647711191871");
  expect(url.searchParams.get("text")).toContain("\nالهاتف: 07711191871\n");
  expect(url.searchParams.get("text")).toContain("الاتصال قبل الوصول");
  await page.screenshot({ path: "artifacts/review/whatsapp-preview-390.png" });
  await page.getByRole("button", { name: "تقليل غسول الوجه المرطب" }).click();
  await expect(page.locator(".sf-cart-summary")).toContainText("56,000 IQD");
  await expect(preview).toHaveCount(0);
  await page.getByRole("button", { name: "حذف سيروم العناية بالبشرة" }).click();
  await expect(page.locator(".sf-cart-item")).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page
      .locator(".sf-bottom-nav")
      .getByRole("button", { name: "السلة، 1 قطع" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

for (const width of [360, 430])
  test(`responsive layout and cart controls at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    await expect(page.locator(".sf-product")).toHaveCount(6);
    await page.evaluate(() => document.fonts.ready);
    await noOverflow(page);
    await page.screenshot({ path: `artifacts/review/home-${width}.png` });
    const touchTargets = page.locator(
      ".sf-bottom-nav button,.sf-header-actions button,.sf-add,.sf-categories button",
    );
    for (const item of await touchTargets.all()) {
      const box = await item.boundingBox();
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
    await page
      .locator(".sf-product-title")
      .first()
      .evaluate(
        (e) =>
          (e.textContent =
            "غسول مرطب للوجه والبشرة الحساسة Hydrating Cleanser بحجم العائلة"),
      );
    await page
      .locator(".sf-product .sf-brand-name")
      .first()
      .evaluate((e) => (e.textContent = "LONG BRAND NAME / اسم الماركة"));
    await noOverflow(page);
    await page
      .locator(".sf-product-image img")
      .first()
      .evaluate(
        (img: HTMLImageElement) => (img.src = "/missing-product-test.png"),
      );
    await expect(page.locator(".sf-image-fallback")).toBeVisible();
    await page
      .getByRole("button", { name: "أضف غسول الوجه المرطب للسلة" })
      .click();
    await page
      .locator(".sf-bottom-nav")
      .getByRole("button", { name: "السلة، 1 قطع" })
      .click();
    await noOverflow(page);
    await page.getByLabel("الاسم الكامل").focus();
    await page.setViewportSize({ width, height: 480 });
    await expect(
      page.getByRole("button", { name: "أرسل الطلب على واتساب" }),
    ).toBeVisible();
    const footer = await page.locator(".sf-cart-summary").boundingBox();
    expect(footer!.y + footer!.height).toBeLessThanOrEqual(481);
    await noOverflow(page);
    await page.screenshot({
      path: `artifacts/review/cart-short-viewport-${width}.png`,
    });
    await page.setViewportSize({ width, height: 844 });
    await page.getByRole("button", { name: "حذف غسول الوجه المرطب" }).click();
    await expect(page.getByText("سلّتك تنتظر اختياراتك")).toBeVisible();
  });

test("desktop composition and original logo on both surfaces", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await expect(page.locator(".sf-product")).toHaveCount(6);
  await page.evaluate(() => document.fonts.ready);
  await noOverflow(page);
  await expect(page.locator(".sf-bottom-nav")).toBeVisible();
  await expect(page.locator(".sf-desktop-nav")).toBeVisible();
  await page.screenshot({ path: "artifacts/review/home-desktop.png" });
  await page.screenshot({
    path: "artifacts/review/home-desktop-full.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 700, height: 350 });
  await page.setContent(
    '<main style="display:flex;margin:0;height:310px"><section style="background:#faf8f4;flex:1;display:grid;place-items:center"><img width="240" height="240" src="http://127.0.0.1:3000/logo.png" alt="Original logo on ivory"></section><section style="background:#12365b;flex:1;display:grid;place-items:center"><img width="240" height="240" src="http://127.0.0.1:3000/logo.png" alt="Original logo on navy"></section></main>',
  );
  await page
    .locator("img")
    .first()
    .evaluate((img: HTMLImageElement) => img.decode());
  await page.screenshot({ path: "artifacts/review/logo-light-dark.png" });
});
