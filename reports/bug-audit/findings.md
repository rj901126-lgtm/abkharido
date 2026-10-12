# Website bug audit — 12 October 2026

Baseline: cdb6606, restoring the pre-chat UI. Application source was not modified during this audit.

Update: all four findings below were fixed after user authorization. Browser reproductions now pass: products render, saved cart hydrates without errors, one mobile purchase bar is visible, and `/api/auth/session` returns 200. `next build --webpack` completed successfully; database connection warnings occurred during static generation. Original evidence below records the before state. Regression results are in `results.json` and assertions in `audit.mjs`.

## 1. P1 — Authentication route fails and blocks production build

Reproduced: `GET http://localhost:3002/api/auth/session` returns HTTP 500. `npx next build --webpack` compiles and passes TypeScript, then fails collecting page data for `/api/auth/[...nextauth]` with `TypeError: w is not a function`.

Impact: session retrieval fails in the current environment and this production build cannot finish. Investigate NextAuth/provider import interoperability before deployment; the precise offending callable was not established from the minified stack.

Source: `src/app/api/auth/[...nextauth]/route.js`.

## 2. P1 — Client-loaded products are masked by an empty SSR array

Reproduced in an isolated browser with the products API returning one valid published, in-stock product: homepage and unfiltered catalog both render zero product cards after the client request completes.

Home uses `initialProducts || contextProducts || []`; an empty array is truthy. Catalog initializes `serverProducts` from `initialProducts || null` and prioritizes any non-null serverProducts value. Therefore an empty SSR list takes precedence over subsequently loaded context products.

Impact: visitors can see an empty catalog even when the client API returns stock. Reproduction uses browser-only fixtures; it does not assert current production inventory is empty.

Sources: `src/views/Home.jsx:37`; `src/views/ProductCatalog.jsx:39`, `:100`, `:136`.

## 3. P2 — Saved guest cart causes hydration mismatch

Reproduced: seed one guest cart item in isolated browser localStorage, then open `/cart`. React reports that the server and client HTML do not match. The cart eventually shows the item after client regeneration.

Cause: the cart state initializer reads browser storage during initial rendering; the server initially renders an empty cart while the client can initially render a populated cart.

Impact: unnecessary client regeneration and potential visible flicker when returning with items in the bag. This does not prove cart items are lost.

Source: `src/context/AppContext.jsx:126`.

## 4. P2 — Two mobile purchase bars overlap

Reproduced on the existing signature product page at 390×844: both `.vip-fixed-bottom-purchase-bar` and `.mobile-sticky-cart-bar` are visible with bottom position 844px. Their z-index values are 2500 and 1050 respectively.

Impact: duplicated purchase actions overlap and one bar obscures the other.

Sources: `src/views/ProductDetails.jsx:1744`, `:2077`; `src/assets/styles/product.css:254`, `:961`.

## Scope and evidence

- Browser evidence: `results.json` and screenshots in this directory.
- Browser script: `audit.mjs`.
- No source fixes, live orders, payments, OTP sends, or account changes were performed.
- Authenticated seller/admin/order flows were not exercised.
- This is a targeted functional audit, not an exhaustive repository or security audit.
