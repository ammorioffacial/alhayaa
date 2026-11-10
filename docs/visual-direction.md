# Visual direction: Hayat Al Majd

## Intent

Build a calm Arabic pharmacy and beauty storefront with the immediacy of a good shopping app and the confidence of a carefully art-directed retail site. The recognizable navy and gold brand stays central. Friendly 3D care objects add character, while real product data, readable Arabic, and obvious actions carry the shopping experience.

This direction follows a direct visual inspection of every file in `References/`, every supplied decorative asset in `icon/`, the existing editorial image, the brand logo, and the current product/category SVGs. The complete source-by-source audit is in [asset-inventory.md](asset-inventory.md).

## Principles taken from the references

The pharmacy reference (`66d82d…`) provides the strongest functional model: a search-first header, clear category entry points, generous product imagery, visible prices, straightforward quantity controls, and a cart built from readable rows. Its discounts, ratings, brands, and claims belong to that reference and are not imported.

The ASOS reference (`7a4880…`) provides the strongest restraint: a clear primary action, quiet neutral cards, well-sized category tiles, a useful two-column mobile product grid, and compact navigation. Its product-detail composition informs a larger image beside a clear purchase panel on desktop and a stacked purchase flow on mobile.

The AirPods reference (`26805b…`) contributes object scale and confident composition. A single care bag can hold the hero visually without stacking unrelated floating shapes, badges, or invented statistics. The blue bag's navy, gold, mint, and lavender details make it specific to the supplied resource library.

The mobile commerce reference (`51af89…`) supports prominent search and fast access to saved products and the cart. Persistent navigation should retain explicit labels and clear active states. The store must keep enough bottom padding that navigation never covers content or checkout controls.

The ZenZ (`e62ce2…`), planner (`185092…`), and Momo (`e7a7cc…`) references share friendly 3D forms, pale canvases, softened surfaces, and clear grouping. These become category artwork and gentle surface contrast. Glowing buttons, low-contrast neumorphism, decorative gradients, scattered confetti, and rainbow UI colors are deliberately omitted because they make pharmacy shopping less clear.

The three dashboard references (`56a891…`, `71a533…`, `c66552…`) contribute alignment, consistent internal spacing, and readable row hierarchy. They do not justify adding fabricated sales statistics or dashboard density to the public storefront.

## Brand expression

The foundation is deep navy `#163a58`, porcelain `#f4f7f9`, white, and icy blue `#e8f0f5`. Muted gold `#b28d58` connects the existing logo to selective brand details. Pink, peach, and mint appear in supplied artwork or quiet category surfaces, rather than becoming competing action colors.

Typography should prioritize Arabic shape, baseline alignment, and readable line height. Headlines can be substantial and expressive while body copy, product names, prices, controls, and labels remain efficient. Maintain one coherent Arabic family and a restrained set of weights. Avoid tiny secondary text, excessive tracking, and decorative English text that does not help the customer.

Use different radii according to purpose: modest rounding for controls, larger rounding for product image wells and collection panels, and circular treatment only for truly circular icon actions. Soft shadows establish floating navigation and overlays; most ordinary content is separated by spacing, pale surfaces, or fine borders.

## Distinct desktop and mobile compositions

Desktop uses a full-width shopping header, a broad search field, clear navigation, and a composed two-part hero. A large decorative care bag balances a concise Arabic headline and immediate shopping actions. Category discovery and product grids use the available width deliberately, with editorial imagery placed in a spacious supporting feature.

Mobile is composed as a shopping interface: compact branding and actions, readily available search, a shorter hero, compact illustrated categories, a two-column product grid, and reachable persistent navigation. Product details stack imagery above essential buying information. Filters, cart rows, and dialogs must remain usable at narrow widths and short viewport heights. Desktop content should never merely be compressed into a miniature layout.

Tablet is a transition with intentional gutters, card sizing, and wrapping. Required review widths are 375, 430, 768, 1024, and 1440 px.

## Artwork decisions

The supplied blue care bag is the hero artwork. The pump and cotton pads identify skincare, the bathroom essentials set identifies hair/body care, and the peach tube identifies suncare without implying a particular SPF. For cosmetics, use a clean supplied polish or pencil illustration: the supplied pink bag has an unexplained pale diagonal line outside its silhouette and should not become a visible quality defect.

Artwork is served as optimized WebP with transparency intact and fixed intrinsic dimensions. The warm editorial still life is reserved for a secondary brand or care collection feature; it should not compete with the cool hero or imply that the anonymous depicted products are actual SKUs. Original assets remain untouched.

## Content, interaction, and trust

The interface must distinguish real commerce information from decorative editorial content. Preserve product identities, prices, availability, backend images, cart quantities, authentication, operational routes, and existing checkout behavior. Do not add ratings, reviews, discount claims, bestseller assertions, medical advice, guaranteed delivery times, or fabricated product benefits.

Functional icons use Lucide consistently. Keyboard focus must be visible, touch controls comfortably sized, and open/close state changes understandable. Motion answers actions: selection, opening, adding, and confirmation. Any entrance treatment should be brief and restrained; respect reduced motion and do not add the deferred animated nurse mascot.

## Review criteria

The rebuild should feel cohesive through palette, Arabic type, spacing, and illustration scale, rather than through repeated decoration. Review rendered screens for crowded product cards, clipped Arabic, hidden sticky actions, unintended horizontal scrolling, weak contrast, uneven image scale, and cart controls that are hard to reach. Verify the actual customer flows as well as compilation. The evidence and any remaining limitations belong in the implementation report; this direction document is not itself a claim of completed visual QA.
