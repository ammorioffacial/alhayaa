// Captures redesign screenshots and checks overflow, console errors, add-to-cart and the hero fallback.
// Usage: REVIEW_BASE_URL=http://127.0.0.1:3001 node scripts/capture-redesign.mjs
import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

const output = "artifacts/redesign";
const baseURL = process.env.REVIEW_BASE_URL || "http://127.0.0.1:3001";
const widths = [375, 430, 768, 1024, 1440];
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
const results = [];

for (const width of widths) {
  const page = await browser.newPage({
    viewport: { width, height: 900 },
    deviceScaleFactor: 1,
  });
  const pageErrors = [];
  const consoleErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.goto(baseURL);
  await page.locator(".sf-product").first().waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.locator(".sf-hero-poster, .sf-hero-video").first().waitFor();

  // Scroll once through the page so scroll-revealed sections become visible for full-page capture.
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += 500) {
    await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);
    await page.waitForTimeout(90);
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${output}/home-${width}.png`, fullPage: true });
  await page.screenshot({ path: `${output}/fold-${width}.png` });

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  const heroState = await page.evaluate(() => ({
    video: !!document.querySelector("video.sf-hero-video"),
    posterLoaded: !!document.querySelector("img.sf-hero-poster") &&
      document.querySelector("img.sf-hero-poster").naturalWidth > 0,
  }));

  // Detail view, then add to cart and check press feedback and the flying dot.
  await page.locator(".sf-product-image").first().click();
  await page.locator(".sf-detail-dialog").waitFor();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${output}/detail-${width}.png` });
  const addButton = page.getByRole("button", { name: "أضف إلى السلة", exact: true });
  await addButton.click();
  const feedbackText = await page
    .locator(".sf-detail-add")
    .innerText()
    .catch(() => "");
  const dotSeen = await page
    .waitForSelector(".sf-fly-dot", { timeout: 400 })
    .then(() => true)
    .catch(() => false);
  await page.getByRole("button", { name: "إغلاق", exact: true }).click();

  // Cart: the visible cart control (header on wide screens, dock on phones).
  await page.locator("[data-cart-target]:visible").first().click();
  await page.locator(".sf-cart-dialog").waitFor();
  await page.waitForTimeout(450);
  const cartCount = await page
    .locator(".sf-cart-dialog .sf-cart-intro small")
    .innerText()
    .catch(() => "");
  await page.screenshot({ path: `${output}/cart-${width}.png` });

  results.push({
    width,
    overflow,
    heroState,
    addFeedbackText: feedbackText.trim(),
    flyingDotSeen: dotSeen,
    cartIntro: cartCount.trim(),
    pageErrors,
    consoleErrors,
  });
  await page.close();
}

await writeFile(`${output}/metrics.json`, JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
await browser.close();
