// Zain font check: screenshots of the storefront and admin, external font requests, horizontal scroll, console errors.
// Usage: REVIEW_BASE_URL=http://127.0.0.1:3001 DASH_BASE_URL=http://127.0.0.1:3000 node scripts/capture-zain-font.mjs
import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

const out = "artifacts/zain-font";
const base = process.env.REVIEW_BASE_URL || "http://127.0.0.1:3001";
const dashBase = process.env.DASH_BASE_URL || "";
const widths = [375, 1440];
await mkdir(out, { recursive: true });
const browser = await chromium.launch();
const report = { base, widths: [] };

for (const width of widths) {
  const height = width >= 768 ? 900 : 812;
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  const errors = [];
  const external = [];
  const localHost = new URL(base).host;
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text().slice(0, 200)); });
  page.on("request", (r) => {
    const host = new URL(r.url()).host;
    if (r.url().startsWith("data:") || r.url().startsWith("blob:")) return;
    if (host !== localHost) external.push(r.url());
  });

  await page.goto(base, { waitUntil: "load" });
  await page.locator(".sf-product").first().waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1500);
  const fontCheck = await page.evaluate(async () => {
    const families = [];
    for (const f of document.fonts) if (f.status === "loaded") families.push(`${f.family} ${f.weight} ${f.style}`);
    return {
      bodyFont: getComputedStyle(document.body).fontFamily,
      h1Font: getComputedStyle(document.querySelector("h1")).fontFamily,
      loadedZain: families.filter((x) => x.startsWith("Zain")),
      zainAvailable: document.fonts.check("700 16px Zain"),
    };
  });
  await page.locator(".sf-campaign").screenshot({ path: `${out}/hero-${width}.png` });
  await page.locator(".sf-product-grid").scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
  await page.locator(".sf-product-grid").screenshot({ path: `${out}/cards-${width}.png` });
  const hscroll = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);

  await page.locator(".sf-product .sf-add").first().click();
  await page.waitForTimeout(1600);
  await page.locator("[data-cart-target]:visible").first().click();
  await page.locator(".sf-cart-dialog").waitFor();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${out}/cart-${width}.png` });
  await page.keyboard.press("Escape");

  await page.goto(`${base}/admin/login`, { waitUntil: "load" });
  await page.getByRole("heading", { name: "أهلاً دكتور" }).waitFor();
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${out}/admin-login-${width}.png`, fullPage: true });
  const loginHscroll = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);

  let dashHscroll = null;
  if (dashBase) {
    await page.goto(`${dashBase}/dash-preview`, { waitUntil: "load" });
    await page.locator(".admin-dashboard").waitFor({ timeout: 180000 });
    await page.waitForTimeout(900);
    await page.locator(".admin-dashboard").screenshot({ path: `${out}/admin-dashboard-${width}.png` });
    dashHscroll = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  }

  report.widths.push({
    width,
    fontCheck,
    horizontalScroll: { storefront: hscroll, login: loginHscroll, dashboard: dashHscroll },
    externalRequests: [...new Set(external)],
    errors,
  });
  await page.close();
}
await writeFile(`${out}/metrics.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
await browser.close();
