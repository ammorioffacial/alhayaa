import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

const output = "artifacts/premium-review";
const baseURL = process.env.REVIEW_BASE_URL || "http://127.0.0.1:3000";
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
const results = [];
for (const width of [375, 430, 768, 1024, 1440]) {
  const page = await browser.newPage({
    viewport: { width, height: 1000 },
    deviceScaleFactor: 1,
  });
  const errors = [];
  const consoleErrors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  await page.goto(baseURL);
  await page.locator(".sf-product").first().waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.locator(".sf-campaign-art img").evaluate((img) => img.decode());
  await page.screenshot({
    path: `${output}/home-${width}.png`,
    fullPage: true,
  });
  await page.screenshot({ path: `${output}/fold-${width}.png` });
  const metrics = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > innerWidth,
    firstProductY: document.querySelector(".sf-product").getBoundingClientRect()
      .y,
    font: getComputedStyle(document.body).fontFamily,
  }));
  await page.locator(".sf-product-image").first().click();
  await page.screenshot({ path: `${output}/detail-${width}.png` });
  await page
    .getByRole("button", { name: "أضف إلى السلة", exact: true })
    .click();
  await page.getByRole("button", { name: "إغلاق", exact: true }).click();
  await page
    .locator(width < 768 ? ".sf-bottom-nav" : ".sf-header-actions")
    .getByRole("button", { name: "السلة، 1 قطع" })
    .click();
  await page.screenshot({ path: `${output}/cart-${width}.png` });
  await page.goto(`${baseURL}/admin/login`);
  await page.getByRole("heading", { name: "أهلاً دكتور" }).waitFor();
  await page.screenshot({
    path: `${output}/login-${width}.png`,
    fullPage: true,
  });
  results.push({ width, ...metrics, errors, consoleErrors });
  await page.close();
}
await writeFile(`${output}/metrics.json`, JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
await browser.close();
