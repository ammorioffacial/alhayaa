// Captures the homepage hero card while its video plays and measures:
// - layout and layer facts (video fills the card, z-order, overflow and radius)
// - WCAG contrast of each hero text element against the worst pixel behind it, for every playlist clip
// - rounded-corner clipping (corner pixels compared with the same area when the card is hidden)
// Usage: REVIEW_BASE_URL=http://127.0.0.1:3001 node scripts/capture-hero-v3.mjs
import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

const out = "artifacts/hero-v3";
const baseURL = process.env.REVIEW_BASE_URL || "http://127.0.0.1:3001";
const SELECTORS = [
  ".sf-kicker",
  ".sf-campaign h1",
  ".sf-campaign-copy > p",
  ".sf-hero-actions .sf-primary",
  ".sf-hero-actions .sf-ghost",
  ".sf-hero-foot",
];

await mkdir(out, { recursive: true });
const browser = await chromium.launch();

// Runs in the page: layout facts for the card, its layers, the video and the text elements.
function geometry(selectors) {
  const card = document.querySelector(".sf-campaign");
  const cr = card.getBoundingClientRect();
  const cs = getComputedStyle(card);
  const video = document.querySelector("video.sf-hero-video");
  const vr = video ? video.getBoundingClientRect() : null;
  const vs = video ? getComputedStyle(video) : null;
  const art = getComputedStyle(document.querySelector(".sf-campaign-art"));
  const shade = getComputedStyle(document.querySelector(".sf-campaign-shade"));
  const copy = getComputedStyle(document.querySelector(".sf-campaign-copy"));
  const texts = [];
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (!el || !el.offsetParent) continue;
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    texts.push({ sel, x: r.left, y: r.top, w: r.width, h: r.height, color: s.color, bg: s.backgroundColor, fontSize: s.fontSize, fontWeight: s.fontWeight });
  }
  return {
    card: { x: cr.left, y: cr.top, w: cr.width, h: cr.height, position: cs.position, overflow: cs.overflow, radius: cs.borderTopLeftRadius, backgroundImage: cs.backgroundImage, backgroundColor: cs.backgroundColor },
    layers: {
      art: { position: art.position, zIndex: art.zIndex, inset: art.inset },
      shade: { zIndex: shade.zIndex, backgroundImage: shade.backgroundImage },
      copy: { position: copy.position, zIndex: copy.zIndex },
    },
    video: video
      ? { present: true, rect: { x: vr.left, y: vr.top, w: vr.width, h: vr.height }, objectFit: vs.objectFit, opacity: vs.opacity, zIndex: vs.zIndex, position: vs.position, src: video.currentSrc }
      : { present: false },
    texts,
  };
}

// Runs in the page: decodes the two screenshots and measures contrast and corners.
async function analyze([bgB64, baseB64, g]) {
  const load = (b64) => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = "data:image/png;base64," + b64;
  });
  const toData = async (b64) => {
    const img = await load(b64);
    const c = document.createElement("canvas");
    c.width = img.width;
    c.height = img.height;
    const ctx = c.getContext("2d");
    ctx.drawImage(img, 0, 0);
    return { w: img.width, h: img.height, d: ctx.getImageData(0, 0, img.width, img.height).data };
  };
  const bg = await toData(bgB64);
  const base = await toData(baseB64);
  const lum = (r, gg, b) => {
    const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(gg) + 0.0722 * f(b);
  };
  const parse = (s) => {
    const m = s.match(/rgba?\(([^)]+)\)/);
    if (!m) return { r: 0, g: 0, b: 0, a: 0 };
    const p = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const px = (img, x, y) => { const i = (y * img.w + x) * 4; return [img.d[i], img.d[i + 1], img.d[i + 2]]; };
  const W = Math.round(g.card.w), H = Math.round(g.card.h);
  const corners = [[1, 1], [W - 2, 1], [1, H - 2], [W - 2, H - 2]].map(([x, y]) => {
    const a = px(bg, x, y), b = px(base, x, y);
    return Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]), Math.abs(a[2] - b[2]));
  });
  const results = g.texts.map((t) => {
    const fg = parse(t.color), bgc = parse(t.bg);
    const x0 = Math.max(0, Math.floor(t.x - g.card.x)), y0 = Math.max(0, Math.floor(t.y - g.card.y));
    const x1 = Math.min(bg.w, Math.ceil(t.x - g.card.x + t.w)), y1 = Math.min(bg.h, Math.ceil(t.y - g.card.y + t.h));
    let worst = Infinity, worstBg = null;
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const p = px(bg, x, y);
        const bgp = bgc.a > 0 ? [bgc.r, bgc.g, bgc.b].map((c, k) => bgc.a * c + (1 - bgc.a) * p[k]) : p;
        const fgE = [fg.r, fg.g, fg.b].map((c, k) => fg.a * c + (1 - fg.a) * bgp[k]);
        const L1 = lum(...fgE), L2 = lum(...bgp);
        const cr = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
        if (cr < worst) { worst = cr; worstBg = bgp.map(Math.round); }
      }
    }
    const size = parseFloat(t.fontSize), weight = Number(t.fontWeight);
    const needed = size >= 24 || (size >= 18.66 && weight >= 700) ? 3 : 4.5;
    return { sel: t.sel, fontSize: size, fontWeight: weight, minContrast: Number(worst.toFixed(2)), requiredAA: needed, passesAA: worst >= needed, worstBackgroundRGB: worstBg };
  });
  return { corners, results };
}

const summary = [];
for (const width of [1440, 375]) {
  const height = width >= 768 ? 900 : 812;
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await page.goto(baseURL, { waitUntil: "load" });
  await page.locator("video.sf-hero-video").waitFor();
  await page.waitForTimeout(1600); // let the hero entrance animation finish
  await page.evaluate(() => {
    const v = document.querySelector("video.sf-hero-video");
    v.muted = true;
    return v.play().catch(() => {});
  });
  await page.waitForFunction(() => {
    const v = document.querySelector("video.sf-hero-video");
    return v && v.readyState >= 2 && v.currentTime > 0.3;
  }, null, { timeout: 30000 });

  const geo = await page.evaluate(geometry, SELECTORS);
  const clip = { x: geo.card.x, y: geo.card.y, width: geo.card.w, height: geo.card.h };
  const clipsSeen = [];
  const runs = [];
  for (let k = 0; k < 3; k++) {
    if (k > 0) {
      // Wait for the playlist to move on to a clip that has not been measured yet.
      await page.waitForFunction((seen) => {
        const v = document.querySelector("video.sf-hero-video");
        return v && !seen.includes(v.currentSrc) && v.readyState >= 2;
      }, clipsSeen, { timeout: 30000 });
    }
    await page.waitForTimeout(1200);
    const src = await page.evaluate(() => {
      const v = document.querySelector("video.sf-hero-video");
      v.pause();
      return v.currentSrc;
    });
    clipsSeen.push(src);

    // 1) Background only: the copy is hidden so the pixels behind the text are visible.
    // Freeze the slow page-background blobs so the corner reference is taken from the same pixels.
    // The card's outer box-shadow spills past the rounded corners, so it is removed for this measurement only.
    const hideCopy = await page.addStyleTag({ content: ".sf-campaign-copy{visibility:hidden !important} .sf-ambient span{animation:none !important} .sf-campaign{box-shadow:none !important}" });
    const bgShot = await page.screenshot({ clip });
    // 2) Same area with the whole card hidden: the page background reference for corners.
    await page.evaluate(() => { document.querySelector(".sf-campaign").style.visibility = "hidden"; });
    const baseShot = await page.screenshot({ clip });
    await page.evaluate(() => { document.querySelector(".sf-campaign").style.visibility = ""; });
    const geoNow = await page.evaluate(geometry, SELECTORS);
    const measured = await page.evaluate(analyze, [bgShot.toString("base64"), baseShot.toString("base64"), geoNow]);
    runs.push({ clip: src, corners: measured.corners, texts: measured.results });
    await hideCopy.evaluate((el) => el.remove());

    // 3) The visible hero, as a visitor sees it, with the video still playing.
    await page.evaluate(() => document.querySelector("video.sf-hero-video").play().catch(() => {}));
    const visible = await page.screenshot({ clip });
    await writeFile(`${out}/hero-${width}-clip${k + 1}.png`, visible);
    if (k === 0) await writeFile(`${out}/hero-${width}.png`, visible);
  }

  const worstContrast = Math.min(...runs.flatMap((r) => r.texts.map((t) => t.minContrast)));
  const allTextPassesAA = runs.every((r) => r.texts.every((t) => t.passesAA));
  const maxCornerDelta = Math.max(...runs.flatMap((r) => r.corners));
  const result = { width, geometry: geo, clipsMeasured: clipsSeen, runs, worstContrast, allTextPassesAA, maxCornerDelta, pageErrors: errors };
  summary.push(result);
  await writeFile(`${out}/verify-${width}.json`, JSON.stringify(result, null, 2));
  await page.close();
}
const brief = summary.map(({ width, worstContrast, allTextPassesAA, maxCornerDelta, pageErrors, clipsMeasured }) => ({ width, worstContrast, allTextPassesAA, maxCornerDelta, pageErrors, clipsMeasured }));
await writeFile(`${out}/summary.json`, JSON.stringify(brief, null, 2));
console.log(JSON.stringify(brief, null, 2));
await browser.close();
