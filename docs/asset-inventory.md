# Asset inventory

Audited 9 November 2026. All ten reference JPGs were opened individually. All ten supplied icon assets were viewed on contact sheets; selected production derivatives were opened again at full size. Existing product/category SVGs were rendered in Chromium and visually inspected. The original files remain unchanged.

## Supplied references

These are inspiration documents, not artwork to embed in the storefront. All are opaque RGB JPEGs.

| Reference in `References/`             | Dimensions  | Visual lesson and relevance                                                                                                                                                                                              |
| -------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `18509243792bc5933e082829d770639b.jpg` | 1000 × 750  | Planner app: clear floating action hierarchy, friendly 3D illustration, white panels on sky blue. Borrow the illustration-to-interface separation; avoid the heavy button glow.                                          |
| `26805bd941b9044f78c666812c6d24a4.jpg` | 1080 × 752  | AirPods commerce: one large object, confident type, pill filters, calm two-column grid. Borrow image scale and product breathing room, not the purple palette.                                                           |
| `51af89e627a822d1c270bc372e41b389.jpg` | 1080 × 1443 | Mobile commerce: prominent search, compact category shortcuts, product photography, persistent bottom navigation. Strong discovery reference; avoid tiny secondary text and excessive shortcuts.                         |
| `56a891cee66fe7eff55585591943ae33.jpg` | 1200 × 900  | Modern dashboard: disciplined alignment, white cards, muted canvas, consistent rounding. Useful for account/admin surfaces; large analytics cards do not belong on the store homepage.                                   |
| `66d82d6347618326fe92ee82a05c5dd5.jpg` | 1200 × 900  | Pharmacy app: image-led categories, restrained icy-blue background, clear quantity controls, clean cart rows. Most directly applicable commerce flow. Reference ratings, sales claims, and discounts must not be copied. |
| `71a5332e7b7c9772175e3075a9bab63b.jpg` | 1000 × 750  | Dense dashboard: alignment and clear row structure. Small type, rainbow cards, and decorative gradients are unsuitable for the customer storefront.                                                                      |
| `7a4880b93cbdd5f7217e8d6ddc54b58c.jpg` | 1200 × 900  | ASOS mobile: restrained chrome, generous imagery, confident dark actions, well-sized filters and categories. Primary spacing and action reference.                                                                       |
| `c6655253c4168212bbe2c1533f0b22c6.jpg` | 1000 × 750  | Dashboard: grid rhythm, compact sidebar, clear grouping. Borrow alignment; avoid the saturated gradient statistics cards.                                                                                                |
| `e62ce2979280c0fff3f47f02cd0cc115.jpg` | 1200 × 800  | ZenZ app: soft 3D icons with white inset surfaces, rounded action rows, clear content hierarchy. Borrow friendly material quality; reduce palette and decorative density.                                                |
| `e7a7cc442eede74aaca85ceb0410c619.jpg` | 1200 × 1734 | Momo UI kit: icy canvas, soft raised objects, repeated roundness, clear grouped lists. Borrow cool surface contrast; avoid low-contrast neumorphic controls.                                                             |

## Supplied decorative assets

All PNGs have genuine alpha transparency with both fully transparent and opaque pixels. All are sufficiently large for category illustration. The 626 px pencil is sufficient for small tiles but should not be enlarged into a desktop hero.

| Original in `icon/`                                            | Dimensions  | Original size | Subject / recommended use                                                                                                                                                                                                       |
| -------------------------------------------------------------- | ----------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `133858.jpg`                                                   | 1500 × 1500 | 424 KB        | Glossy blue first-aid cross on opaque white. Visually heavier than the other assets; do not use as a functional icon or as evidence of a medicine category that does not exist.                                                 |
| `bathroom-essentials-3d-cartoon-style.png`                     | 1706 × 2000 | 1,176 KB      | Blue tray, bottles, comb and toiletries. Suitable for hair/body care category, using a cool surface.                                                                                                                            |
| `beauty-make-up-3d-icon (1).png`                               | 626 × 626   | 121 KB        | Pink brow pencil/brush. Clean simple cosmetics category alternative.                                                                                                                                                            |
| `beauty-make-up-3d-icon (2).png`                               | 2000 × 2000 | 874 KB        | Pink sheet mask and leaf. Optional skincare subcategory; its bright pink should stay confined to the artwork.                                                                                                                   |
| `beauty-make-up-3d-icon (3).png`                               | 2000 × 2000 | 707 KB        | Peach tube. Suitable as a generic suncare category illustration, without making SPF or ingredient claims.                                                                                                                       |
| `beauty-make-up-3d-icon (4).png`                               | 2000 × 2000 | 474 KB        | Pump bottle and cotton pads. Preferred skincare category illustration.                                                                                                                                                          |
| `beauty-make-up-3d-icon (5).png`                               | 2000 × 2000 | 892 KB        | Pink nail polish and open brush. Clean cosmetics category alternative; glass highlights remain legible at small sizes.                                                                                                          |
| `beauty-make-up-3d-icon.png`                                   | 2000 × 2000 | 595 KB        | Facial roller. Optional skincare accessory illustration.                                                                                                                                                                        |
| `cosmetic-bag-3d-icon-illustration.png`                        | 2000 × 2000 | 883 KB        | Pink makeup pouch. Contains a pale diagonal line outside the silhouette in the original; use the clean pencil or polish alternative for production. The derivative preserves this issue rather than modifying the original art. |
| `stylized-beauty-bag-containing-diverse-skincare-products.png` | 2000 × 2000 | 1,395 KB      | Blue care bag with bottles. Strongest hero asset: navy-compatible form, gold bottle, mint accents, soft material, convincing depth. Use as decorative collection artwork, not a purchasable bundle.                             |

## Optimized derivatives

Production derivatives preserve transparency and original colors. Empty alpha bounds were trimmed, the artwork was proportionally resized, and a consistent transparent margin was added. No AI image generation, retouching, recoloring, or external imagery was used.

All category derivatives are 512 × 512 WebP and live in `public/images/categories/`:

| File                 | Source                              | Size         |
| -------------------- | ----------------------------------- | ------------ |
| `skincare-care.webp` | Pump/cotton PNG `(4)`               | 14,406 bytes |
| `sun-care.webp`      | Peach tube PNG `(3)`                | 14,818 bytes |
| `hair-and-body.webp` | Bathroom essentials PNG             | 32,434 bytes |
| `beauty-pouch.webp`  | Pink pouch PNG; source line remains | 22,202 bytes |
| `beauty-polish.webp` | Nail polish PNG `(5)`               | 25,638 bytes |
| `beauty-pencil.webp` | Pencil PNG `(1)`                    | 15,940 bytes |
| `beauty-roller.webp` | Roller PNG                          | 16,688 bytes |
| `skincare-mask.webp` | Sheet mask PNG `(2)`                | 23,134 bytes |
| `care-bag.webp`      | Blue care bag PNG                   | 28,592 bytes |

Additional files in `public/images/`:

| File                       | Dimensions  | Size          | Purpose                                          |
| -------------------------- | ----------- | ------------- | ------------------------------------------------ |
| `care-bag-hero.webp`       | 1024 × 1024 | 77,324 bytes  | Transparent blue care bag hero, with safe margin |
| `care-editorial.webp`      | 1536 × 1024 | 219,510 bytes | Full-resolution optimized editorial original     |
| `care-editorial-1200.webp` | 1200 × 800  | 138,232 bytes | Desktop editorial image                          |
| `care-editorial-640.webp`  | 640 × 427   | 52,556 bytes  | Mobile editorial image                           |

## Existing public assets

- `public/images/logo-mark.webp`: 240 × 240, transparent, 15,672 bytes. Lossy WebP resize of the original logo for header/footer/admin use. Original `public/logo.png` and the source `logo` remain intact; `NEXT_PUBLIC_LOGO_URL` still overrides the display path.

- `public/images/care-editorial.png`: 1536 × 1024, opaque RGB, 2,405,087 bytes. Warm studio still life of anonymous bottles and a cream jar with stone, linen, and olive leaves. Fits a secondary beauty editorial feature. It is mood artwork, not a product photograph of a listed SKU and not evidence for ingredient, organic, treatment, or therapeutic claims. Optimized variants reduce transfer size substantially.
- `public/logo.png`: 1254 × 1254, transparent RGBA, 398,484 bytes. Existing gold Arabic brand mark. Preserve it as the brand identifier. Some fine edge artifacts appear at large size; it should remain small and use a solid background with sufficient contrast.
- `public/products/{cleanser,cream,hair,placeholder,serum,sun,tint}.svg`: all 280 × 350, about 1–1.2 KB each. Existing stylized bottle and jar illustrations, with text baked into the vector. Preserve existing product mappings. They are generic illustrations, not newly verified product photography. Their gentle shape and restrained palette fit pale product wells, but their labels must not become a new source of product facts.
- `public/illustrations/{cosmetics,haircare,skincare,suncare}.svg`: all 180 × 180, about 1.7–1.8 KB each. Existing navy/gold pseudo-3D icons. Preserve as legacy assets; the supplied rendered category artwork is the chosen visual language for the rebuilt shopping surfaces. Do not combine both illustration systems within one category row.

## Usage rules

Use the existing Lucide SVG library for search, cart, filters, navigation, account, quantity, status, and other functional controls. Keep stroke weight and optical sizes consistent. Decorative 3D images belong to categories or editorial promotion and must not replace recognizable functional symbols. Do not introduce emoji controls.

Keep product photographs and decorative illustration roles distinct. Prefer real backend product imagery whenever present; preserve the current product data and fallback behavior. Reference screenshots contain fabricated-to-this-store reviews, discounts, prices, and stock; none should be imported as store facts. The supplied assets' commercial license documents are not present in the repository, so this inventory records provenance as user-supplied without inventing license terms.

Inspection artifacts are in `artifacts/asset-audit/`: `references-1.jpg`, `references-2.jpg`, `icon-1.jpg`, `icon-2.jpg`, `existing-svg-assets.png`, `pink-bag-dark.jpg`, and `metadata.json`.
