# Hayat Al Majd design system

## Source of truth

`src/app/globals.css` owns the brand and semantic tokens, document defaults, shared forms, login and administration. `src/app/storefront.css` owns responsive commerce layouts, navigation and cart. `src/components/storefront/product-experience.css` owns product cards, product imagery and details. All three are imported once by the root layout; the historical `mobile-store.css` is no longer loaded.

The active storefront is `src/components/storefront/home.tsx`. The former `components/store.tsx` is now a compatibility export, so there is one implementation of shopping behavior. Keep database access in `lib/products.ts`, commerce validation in `lib/catalog.ts`, cart behavior in `use-shopping.ts`, and browser-only saved IDs in `use-favorites.ts`.

## Colors

| Token                          | Value                 | Role                                      |
| ------------------------------ | --------------------- | ----------------------------------------- |
| `--navy`                       | `#163a58`             | Brand, headings, primary actions          |
| `--interactive`                | `#1d4c70`             | Interactive emphasis                      |
| `--gold`                       | `#b28d58`             | Brand accents and focus indicators        |
| `--ice`                        | `#e8f0f5`             | Secondary controls and pale blue surfaces |
| `--ivory`                      | `#f8f9fa`             | Page and working surfaces                 |
| `--surface`                    | `#ffffff`             | Cards, forms and overlays                 |
| `--ink`                        | `#24394a`             | Main text                                 |
| `--muted`                      | `#627482`             | Supporting text                           |
| `--line`                       | `#e2e8ed`             | Surface boundaries                        |
| `--success` / `--success-soft` | `#28715a` / `#edf7f1` | Confirmations and available states        |
| `--warning` / `--warning-soft` | `#8b6127` / `#fbf4e8` | Caution and demo information              |
| `--error` / `--error-soft`     | `#a13b3e` / `#fff1f0` | Validation and failed requests            |

Storefront `--sf-*` aliases reference these brand tokens. Muted peach, sage and blush are category backgrounds, never competing primary action colors. The gold is an accent, not a small-text color on white. Use the darker warning color for readable gold-toned text. Product photographs retain their original colors; no blending or color filters.

## Arabic typography

Zain is the only typeface. It is self-hosted through Fontsource (`@fontsource/zain`) at 400, 700 and 800, and set once through the `--font-arabic` token on `:root`. Requested weights 500 and 600 map to 400 and 700. No weight above 800 and no negative letter-spacing. Do not mix in another family.

| Role | Desktop | Mobile |
| --- | --- | --- |
| Hero title | 44–56 px, line-height 1.25, weight 700 | 36–42 px, line-height 1.25, weight 700 |
| Section title | 28–34 px, line-height 1.25, weight 600 | 24 px, weight 600 |
| Card title | 17 px, weight 600 | 17 px, weight 600 |
| Price | 16 px, weight 600 | 16 px, weight 600 |
| Body | 16 px, line-height 1.7 | 15 px, line-height 1.7 |
| Floor | 14 px for the smallest label (sub-brand). Nothing is set below 14 px. | |

Numbers use Western digits (0–9) everywhere: `Intl.NumberFormat("en-US")`, counts, prices, the cart badge, and the trust strip. Prices read "24,000 IQD" through `formatPrice()` in `src/lib/catalog.ts`. Product counts use `productCount()` in `src/lib/arabic-plural.ts`, which applies Arabic agreement (0, 1, 2, 3–10, 11+). The WhatsApp message keeps its original `money()` format (Arabic-Indic digits and "د.ع") because it is an outbound message, not part of the page.

Do not letter-space Arabic. Use `<bdi>` for brand names, phone numbers and currency; `dir="auto"` handles mixed product names and descriptions.

## Spacing, surfaces and layout

The base spacing scale is 4, 8, 12, 16, 24, 32, 48 and 64 px (`--space-1` through `--space-8`). Desktop content is capped at 1280 px with 48 px outer gutters; tablet gutters are 28 px; mobile gutters are 16 px, or 12 px below 370 px. Desktop sections use approximately 40–56 px separation; mobile sections use 16–32 px.

Controls use 9–12 px radii, product cards 16–20 px, feature panels 18–28 px and dialogs 18–24 px. Border width is normally 1 px. Shadows stay very light on cards; overlays can use the larger `--shadow-lg` depth. Most hierarchy comes from whitespace, background contrast and type size.

Product grids use two columns on phones and tablets through 900 px, then four columns. Actual featured flags determine the first collection. The remaining products share a grid with an editorial panel spanning two columns, so the six-item demo catalog has a deliberate desktop composition. No bestseller ranking is inferred.

## Components

- **Buttons:** 44 px minimum touch target; primary actions are navy with white text. Secondary actions use pale blue or a quiet border. Icon-only actions always have accessible labels. Active, disabled, pressed and focus states are distinct.
- **Product cards:** fixed image ratio, contained original imagery, factual availability/featured/demo badges, independent favorite control, two-line readable name, category, price and a full-width add action. Broken images show a deliberate fallback.
- **Product details:** a single actual image, real description, price, stock status, quantity 1–99, saved-item action and at most two same-category suggestions. Do not render fake gallery pagination, reviews, discounts or ingredient claims.
- **Search and filters:** search stays in the header. On mobile, the accessible filter button reveals availability and sorting controls. Empty views include a reset action. Favorites persist locally and work in memory if storage is blocked.
- **Dialogs:** background browsing becomes inert; focus is contained, Escape closes, and focus returns to the triggering control after inert is removed. Related-product navigation resets the detail scroll and focuses the close control.
- **Cart:** full-height on mobile, a side panel on desktop. Item rows and delivery fields scroll independently above an always-visible total and submission action. Preserve server reconciliation of stock/prices and the existing WhatsApp confirmation flow.
- **Forms:** labels stay visible; native validation remains enabled; phone/name/address autocomplete is preserved. Validation and errors are announced. Never turn sample/demo products into live orderable stock.

## Iconography and artwork

Functional icons are Lucide with roughly 1.65–1.8 px strokes, normally 16–22 px. Decorative icons are hidden from assistive technology when accompanying text. Never substitute emoji for navigation or commerce actions.

Supplied 3D illustrations are limited to the hero and category/collection discovery. They are not product photos or purchasable bundles. Use the inspected WebP derivatives from `public/images/`; keep original assets intact. The pink pouch's source artifact is documented and that asset is not used. See [asset-inventory.md](asset-inventory.md) for exact mappings and sizes.

## Responsive and motion rules

At 767 px and below, use compact search/header, shortened hero, four illustrated shortcuts, two-column products, collapsible filters and five labeled bottom destinations. Reserve space for bottom navigation and safe-area insets. Cart totals remain visible even at a 480 px viewport height. At larger widths, use full navigation, a two-part hero, roomy product composition and an anchored cart panel.

Transitions are 160–240 ms and answer a user action. Product hover slightly scales the image; categories lift a few pixels; dialogs and feedback enter briefly. Avoid ambient animation, sound, parallax or heavy animation packages. `prefers-reduced-motion` disables animation, transitions and smooth scrolling. The future animated nurse mascot is deliberately excluded.

## Maintenance and verification

Keep the root `lang="ar" dir="rtl"`. Prefer logical CSS spacing and positioning. Use explicit image dimensions and responsive `next/image` for local hero/category/editorial assets; remote catalog images keep native loading to preserve existing allowed image hosts and data contracts. Below-fold images are lazy loaded. Preserve zoom and keyboard operation.

Run `npm run lint`, `npm run typecheck`, `npm test`, the three demo Playwright suites, and `npm run build`. `node scripts/review-storefront.mjs` captures 375, 430, 768, 1024 and 1440 px screenshots against a running demo server. Review the images, not only the exit code. Live admin CRUD/upload verification needs a dedicated authenticated Supabase test environment.

The review uses the [Vercel Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md) alongside the installed design skills. The reference-specific rationale is in [visual-direction.md](visual-direction.md).
