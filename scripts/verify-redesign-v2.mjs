// Redesign v2 verification: screenshots, horizontal scroll, console errors, fly-to-cart timing,
// cart badge count and pop timing, and Arabic-Indic digits in the server-rendered HTML.
// Usage: REVIEW_BASE_URL=http://127.0.0.1:3001 node scripts/verify-redesign-v2.mjs
import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

const out = "artifacts/redesign-v2";
const baseURL = process.env.REVIEW_BASE_URL || "http://127.0.0.1:3001";
const widths = [375, 430, 768, 1024, 1440];
await mkdir(out, { recursive: true });

// Arabic-Indic digits in the HTML the server sends, excluding scripts and styles.
async function arabicIndicInHtml() {
  const html = await (await fetch(baseURL + "/")).text();
  const visible = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");
  const matches = visible.match(/[٠-٩]/g) || [];
  return { bytes: html.length, arabicIndicCount: matches.length };
}

const browser = await chromium.launch();
const results = [];
for (const width of widths) {
  const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
  const pageErrors = [];
  const consoleErrors = [];
  page.on("pageerror", (e) => pageErrors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });

  await page.goto(baseURL, { waitUntil: "load" });
  await page.locator(".sf-product").first().waitFor();
  await page.evaluate(() => document.fonts.ready);
  // Walk the page once so scroll-revealed sections are visible for the full-page capture.
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += 480) {
    await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);
    await page.waitForTimeout(80);
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${out}/home-${width}.png`, fullPage: true });

  const horizontalScroll = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);

  // Product card row.
  const grid = page.locator(".sf-product-grid");
  await grid.scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
  await grid.screenshot({ path: `${out}/cards-${width}.png` });

  // Fly-to-cart: record the dot's lifetime and the badge class while it flies.
  await page.evaluate(() => {
    window.__fly = { added: null, removed: null, waapiMs: null, popAtFlight: null, popAfter: null };
    const observer = new MutationObserver((records) => {
      for (const r of records) {
        for (const node of r.addedNodes) {
          if (node.classList && node.classList.contains("sf-fly-dot")) {
            window.__fly.added = performance.now();
            const anim = node.getAnimations()[0];
            window.__fly.waapiMs = anim ? anim.effect.getTiming().duration : null;
          }
        }
        for (const node of r.removedNodes) {
          if (node.classList && node.classList.contains("sf-fly-dot")) {
            window.__fly.removed = performance.now();
            window.__fly.popAfter = !!document.querySelector("[data-cart-count].is-pop");
          }
        }
      }
    });
    observer.observe(document.body, { childList: true });
    window.__flyObserver = observer;
  });
  const badgeBefore = await page.locator("[data-cart-target]:visible [data-cart-count], [data-cart-count]").first().textContent().catch(() => null);
  await page.locator(".sf-product .sf-add").first().click();
  await page.waitForTimeout(300);
  const popDuringFlight = await page.evaluate(() => !!document.querySelector("[data-cart-count].is-pop"));
  await page.waitForFunction(() => window.__fly && window.__fly.removed !== null, null, { timeout: 4000 });
  const fly = await page.evaluate(() => {
    const f = window.__fly;
    return { waapiDurationMs: f.waapiMs, observedMs: Math.round(f.removed - f.added), popDuringFlight: null, popAfterArrival: f.popAfter };
  });
  fly.popDuringFlight = popDuringFlight;
  const badgeAfterAdd = await page.evaluate(() => [...document.querySelectorAll("[data-cart-target]")].filter((el) => el.getBoundingClientRect().width > 0).map((el) => el.querySelector("[data-cart-count]")?.textContent ?? null));
  await page.evaluate(() => window.__flyObserver.disconnect());

  // Second add should move the badge to 2.
  await page.locator(".sf-product .sf-add").nth(1).click();
  await page.waitForTimeout(1500);
  const badgeAfterSecond = await page.evaluate(() => [...document.querySelectorAll("[data-cart-target]")].filter((el) => el.getBoundingClientRect().width > 0).map((el) => el.querySelector("[data-cart-count]")?.textContent ?? null));

  // Cart.
  await page.locator("[data-cart-target]:visible").first().click();
  await page.locator(".sf-cart-dialog").waitFor();
  await page.waitForTimeout(450);
  await page.screenshot({ path: `${out}/cart-${width}.png` });
  await page.keyboard.press("Escape");

  results.push({
    width,
    horizontalScroll,
    scrollWidth,
    badgeBefore,
    badgeAfterFirstAdd: badgeAfterAdd,
    badgeAfterSecondAdd: badgeAfterSecond,
    fly,
    pageErrors,
    consoleErrors,
  });
  await page.close();
}

const digits = await arabicIndicInHtml();
const report = { baseURL, widths: results, serverHtmlArabicIndicDigits: digits };
await writeFile(`${out}/metrics.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
await browser.close();
