# AbKharido UI redesign

Work in small, independently visible steps. Preserve existing shopping logic and routes.

## Step 1 — homepage composition

Implemented: editorial introduction with catalog action, larger navy product hero with calmer styling, category tiles, keyboard-accessible carousel indicators, focus states and reduced-motion styling. Removed unsupported superlatives from curated collection copy.

Files: `src/views/Home.jsx`, `src/assets/styles/storefront-refresh.css`.

## Next steps

2. Product cards and shared header: consistent image areas, readable titles, clear pricing, mobile alignment.
3. Catalog and product detail: filter hierarchy, variant selection and purchase panel.
4. Cart and checkout: order-summary hierarchy, forms and mobile sticky controls.
5. Account, orders and portal screens: shared styles and responsive tables.

Visual browser review remains required before assigning a final design rating. Do not claim 10/10 based on source changes alone.

## Step 2 — product cards and header

Implemented: larger product titles and prices, neutral image canvases, visible 44px mobile add-to-cart actions, larger wishlist and quantity controls, keyboard-accessible title navigation, header search polish and focus indicators.

Files: `src/components/ProductCard.jsx`, `src/assets/styles/shopping-refresh.css`, `src/assets/styles/navbar.css`.

Validation: JSX parser and whitespace checks. Browser visual review still pending.
