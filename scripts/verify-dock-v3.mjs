// Dock v3 verification: screenshots with the cart count at 2, badge/icon/label geometry,
// and wall-clock fly-to-cart timing over 10 runs per width.
// Usage: REVIEW_BASE_URL=http://127.0.0.1:3001 node scripts/verify-dock-v3.mjs
import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

const out = "artifacts/dock-v3";
const baseURL = process.env.REVIEW_BASE_URL || "http://127.0.0.1:3001";
await mkdir(out, { recursive: true });
const browser = await chromium.launch();
const report = { baseURL, widths: [] };

for (const width of [375, 1440]) {
  const height = width >= 768 ? 900 : 812;

  // Screenshots and geometry: two items added so the badge reads 2.
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await page.goto(baseURL, { waitUntil: "load" });
  await page.locator(".sf-product").first().waitFor();
  await page.waitForTimeout(1200);
  await page.locator(".sf-product .sf-add").nth(0).click();
  await page.waitForTimeout(1500);
  await page.locator(".sf-product .sf-add").nth(1).click();
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
  await page.waitForTimeout(400);
  const geometry = await page.evaluate(() => {
    const r = (el) => { const b = el.getBoundingClientRect(); return { x: Math.round(b.left), y: Math.round(b.top), w: Math.round(b.width), h: Math.round(b.height) }; };
    const nav = document.querySelector(".sf-bottom-nav");
    const cart = document.querySelector(".sf-dock-cart");
    const badge = cart.querySelector("b");
    const icon = cart.querySelector("svg");
    const pill = document.querySelector(".sf-dock-pill");
    const items = [...document.querySelectorAll(".sf-dock-item")];
    const pillStyle = getComputedStyle(pill);
    const overlap = (a, b) => !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y);
    const badgeRect = r(badge), iconRect = r(icon);
    const itemRects = items.map((el) => ({ label: el.getAttribute("aria-label"), icon: r(el.querySelector(".sf-dock-icon")), text: r(el.querySelector("span:last-child")), box: r(el) }));
    const labelOverflow = items.map((el) => { const t = el.querySelector("span:last-child"); return t.scrollWidth > t.clientWidth + 1; });
    return {
      nav: r(nav), pill: r(pill), cart: r(cart), badge: badgeRect, icon: iconRect,
      badgeText: badge.textContent,
      badgeOverlapsIcon: overlap(badgeRect, iconRect),
      badgeOverlapsItemLabels: itemRects.some((i) => overlap(badgeRect, i.text)),
      cartSize: r(cart),
      pillBackground: pillStyle.backgroundColor,
      pillBackdrop: pillStyle.backdropFilter,
      pillShadow: pillStyle.boxShadow,
      items: itemRects,
      labelOverflow,
      cartInsidePill: pill.contains(cart),
      navFixed: getComputedStyle(nav).position,
      navBottomPx: window.innerHeight - nav.getBoundingClientRect().bottom,
    };
  });
  await page.screenshot({ path: `${out}/dock-${width}-viewport.png` });
  await page.locator(".sf-bottom-nav").screenshot({ path: `${out}/dock-${width}-bar.png` });

  // Fly-to-cart wall-clock time: 10 runs on a fresh page per run.
  const timings = [];
  for (let run = 0; run < 10; run++) {
    const p = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    await p.goto(baseURL, { waitUntil: "load" });
    await p.locator(".sf-product .sf-add").first().waitFor();
    await p.waitForTimeout(900);
    await p.evaluate(() => {
      window.__fly = { added: null, removed: null, waapiMs: null };
      const obs = new MutationObserver((records) => {
        for (const rec of records) {
          for (const n of rec.addedNodes) if (n.classList && n.classList.contains("sf-fly-dot")) {
            window.__fly.added = performance.now();
            const a = n.getAnimations()[0];
            window.__fly.waapiMs = a ? a.effect.getTiming().duration : null;
          }
          for (const n of rec.removedNodes) if (n.classList && n.classList.contains("sf-fly-dot")) window.__fly.removed = performance.now();
        }
      });
      obs.observe(document.body, { childList: true });
    });
    await p.locator(".sf-product .sf-add").first().click();
    await p.waitForFunction(() => window.__fly && window.__fly.removed !== null, null, { timeout: 5000 });
    const t = await p.evaluate(() => ({ observed: window.__fly.removed - window.__fly.added, waapi: window.__fly.waapiMs }));
    timings.push({ run: run + 1, observedMs: Math.round(t.observed), waapiMs: t.waapi });
    await p.close();
  }
  const observed = timings.map((t) => t.observedMs);
  const summary = {
    min: Math.min(...observed),
    max: Math.max(...observed),
    avg: Math.round(observed.reduce((a, b) => a + b, 0) / observed.length),
    allInWindow: observed.every((v) => v >= 1100 && v <= 1300),
  };
  report.widths.push({ width, geometry, pageErrors: errors, timings, summary });
  await page.close();
}
await writeFile(`${out}/metrics.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report.widths.map((w) => ({ width: w.width, badgeOverlapsIcon: w.geometry.badgeOverlapsIcon, badgeOverlapsItemLabels: w.geometry.badgeOverlapsItemLabels, labelOverflow: w.geometry.labelOverflow, badgeText: w.geometry.badgeText, pillBackground: w.geometry.pillBackground, cartSize: w.geometry.cartSize, navBottomPx: w.geometry.navBottomPx, pageErrors: w.pageErrors.length, timing: w.summary })), null, 2));
await browser.close();
