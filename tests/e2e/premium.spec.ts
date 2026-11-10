import { expect, test } from "@playwright/test";

test("saved products persist and can be removed from the favorites view", async ({
  page,
}) => {
  await page.setViewportSize({ width: 430, height: 932 });
  await page.goto("/");
  const save = page.getByRole("button", {
    name: "إضافة غسول الوجه المرطب إلى المفضلة",
    exact: true,
  });
  await save.click();
  await expect(
    page.getByRole("button", {
      name: "إزالة غسول الوجه المرطب من المفضلة",
      exact: true,
    }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await page
    .locator(".sf-bottom-nav")
    .getByRole("button", { name: "المفضلة", exact: true })
    .click();
  await expect(page.locator(".sf-product")).toHaveCount(1);
  await expect(page.locator(".sf-product")).toContainText("غسول الوجه المرطب");
  await page
    .getByRole("button", {
      name: "إزالة غسول الوجه المرطب من المفضلة",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("heading", { name: "احفظي ما يعجبكِ هنا" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "عرض كل المنتجات", exact: true })
    .click();
  await expect(page.locator(".sf-product")).toHaveCount(6);
});

test("mobile filters and numeric sorting change actual catalog results", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  const filters = page.getByRole("button", { name: "تصفية وترتيب المنتجات" });
  await filters.click();
  await expect(filters).toHaveAttribute("aria-expanded", "true");
  await page.getByRole("button", { name: "المتوفر فقط", exact: true }).click();
  await expect(page.locator(".sf-product")).toHaveCount(5);
  await expect(page.locator(".sf-product.is-unavailable")).toHaveCount(0);
  await page
    .getByLabel("ترتيب المنتجات", { exact: true })
    .selectOption("price-asc");
  await expect(page.locator(".sf-product-title").first()).toHaveText(
    "شامبو العناية بالشعر",
  );
  await page
    .getByLabel("ترتيب المنتجات", { exact: true })
    .selectOption("price-desc");
  await expect(page.locator(".sf-product-title").first()).toHaveText(
    "سيروم العناية بالبشرة",
  );
  await page.getByRole("button", { name: "كل المنتجات", exact: true }).click();
  await expect(page.locator(".sf-product")).toHaveCount(6);
  await expect(page.getByLabel("ترتيب المنتجات", { exact: true })).toHaveValue(
    "featured",
  );
});

test("detail quantity, related navigation and keyboard focus remain usable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  const opener = page.getByRole("button", {
    name: "تفاصيل غسول الوجه المرطب",
    exact: true,
  });
  await opener.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "إغلاق", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(dialog.locator(".sf-related-item").last()).toBeFocused();
  await page.getByLabel("الكمية", { exact: true }).fill("3");
  await expect(page.locator(".sf-detail-total")).toContainText("72,000 IQD");
  await page
    .getByRole("button", { name: "أضف إلى السلة", exact: true })
    .click();
  await dialog.locator(".sf-related-item").first().click();
  await expect(page.getByLabel("الكمية", { exact: true })).toHaveValue("1");
  await expect(
    page.getByRole("button", { name: "إغلاق", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(opener).toBeFocused();
  await page
    .locator(".sf-header-actions")
    .getByRole("button", { name: "السلة، 3 قطع" })
    .click();
  await expect(page.locator(".sf-cart-summary")).toContainText("72,000 IQD");
});

test("corrupt saved state and blocked storage do not break shopping", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem("hayat-favorites-v1", "{invalid-json");
    localStorage.setItem(
      "hayat-cart",
      JSON.stringify([{ id: "bad", quantity: -4, price: 3 }]),
    );
    Storage.prototype.setItem = () => {
      throw new DOMException("Blocked", "SecurityError");
    };
  });
  await page.goto("/");
  await page
    .getByRole("button", {
      name: "إضافة غسول الوجه المرطب إلى المفضلة",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("button", {
      name: "إزالة غسول الوجه المرطب من المفضلة",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "أضف غسول الوجه المرطب للسلة", exact: true })
    .click();
  await expect(page.locator(".sf-toast")).toContainText("أُضيف");
});

for (const width of [375, 430, 768, 1024, 1440]) {
  test(`premium layout, loaded artwork and reduced motion at ${width}px`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.locator(".sf-product")).toHaveCount(6);
    await page.evaluate(() => document.fonts.ready);
    await page
      .locator(".sf-campaign-art img")
      .evaluate((img: HTMLImageElement) => img.decode());
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(
      await page
        .locator(".sf-primary")
        .first()
        .evaluate((e) => getComputedStyle(e).transitionDuration),
    ).toBe("0s");
    if (width < 768)
      expect(
        (await page.locator(".sf-product").first().boundingBox())!.y,
      ).toBeLessThan(1100);
    await page
      .getByRole("button", { name: "تفاصيل غسول الوجه المرطب", exact: true })
      .click();
    expect(
      await page
        .locator(".sf-detail-dialog")
        .evaluate((e) => e.scrollWidth <= e.clientWidth),
    ).toBe(true);
    await page.keyboard.press("Escape");
    expect(errors).toEqual([]);
  });
}
