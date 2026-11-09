// Original SVG illustrations; deliberately generic and labelled demo in the UI.
import { mkdirSync, writeFileSync } from "node:fs";
mkdirSync("public/products", { recursive: true });
const items = [
  [
    "cleanser",
    "#cbd6c7",
    "#3d5947",
    "HAYAT",
    "GENTLE CLEANSER",
    "250 ml",
    "pump",
  ],
  [
    "serum",
    "#b98b58",
    "#79522d",
    "DAILY RITUAL",
    "FACE SERUM",
    "30 ml",
    "drop",
  ],
  ["sun", "#f0dcc4", "#a87538", "SUN", "DAILY SUN CARE", "50 ml", "tube"],
  ["hair", "#aabbb0", "#355548", "BOTANICAL", "HAIR SHAMPOO", "300 ml", "pump"],
  ["cream", "#e4ded3", "#756b57", "HAYAT", "DAILY MOISTURE", "50 ml", "jar"],
  ["tint", "#bd8791", "#793d4c", "SOFT BEAUTY", "LIP TINT", "8 ml", "drop"],
  ["placeholder", "#e2e6e7", "#12365b", "HAYAT", "PRODUCT IMAGE", "", "pump"],
];
for (const [id, color, ink, brand, title, size, shape] of items) {
  const body =
    shape === "jar"
      ? '<rect x="65" y="165" width="150" height="95" rx="21" fill="url(#b)"/><rect x="62" y="151" width="156" height="28" rx="8" fill="#ddd8cc"/>'
      : shape === "tube"
        ? '<path d="M83 74h114l-13 197H96z" fill="url(#b)"/><rect x="96" y="268" width="88" height="33" rx="4" fill="#d0c1a5"/>'
        : `<rect x="${shape === "drop" ? 93 : 78}" y="${shape === "drop" ? 126 : 104}" width="${shape === "drop" ? 94 : 124}" height="${shape === "drop" ? 166 : 191}" rx="${shape === "drop" ? 17 : 23}" fill="url(#b)"/>${shape === "drop" ? '<rect x="110" y="88" width="60" height="44" rx="5" fill="#ded9cd"/><path d="M123 88V60q17-23 34 0v28" fill="#f0ede3"/>' : '<rect x="115" y="77" width="50" height="30" rx="4" fill="#e1e5d9"/><path d="M124 77V57h65v12h-41v8" fill="#e5e8e1"/><rect x="122" y="54" width="70" height="10" rx="4" fill="#ebeee8"/>'}`;
  const y = shape === "jar" ? 199 : 183;
  writeFileSync(
    `public/products/${id}.svg`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="280" height="350" viewBox="0 0 280 350"><defs><linearGradient id="b" x1="0" x2="1"><stop stop-color="${color}"/><stop offset=".35" stop-color="#fff" stop-opacity=".75"/><stop offset=".7" stop-color="${color}"/><stop offset="1" stop-color="${ink}" stop-opacity=".45"/></linearGradient><filter id="s"><feGaussianBlur stdDeviation="5"/></filter></defs><ellipse cx="140" cy="306" rx="69" ry="7" fill="#293b2e" opacity=".13" filter="url(#s)"/>${body}<text x="140" y="${y}" text-anchor="middle" fill="${ink}" font-family="Georgia,serif" font-size="${brand.length > 12 ? 11 : 15}" letter-spacing="2">${brand}</text><path d="M120 ${y + 13}h40" stroke="${ink}" stroke-width=".5"/><text x="140" y="${y + 32}" text-anchor="middle" fill="${ink}" font-family="Arial" font-size="7" letter-spacing="1">${title}</text><text x="140" y="${y + 48}" text-anchor="middle" fill="${ink}" font-family="Arial" font-size="7">${size}</text></svg>`,
  );
}
