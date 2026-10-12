# Broader project audit — 12 October 2026

The first four fixes were pushed as commit `37840ad`. This report records additional findings; these additional application changes have not been implemented.

## P1 — Cart actions target every variant of a product

`updateCartQty` and `removeFromCart` match by `isSameProduct`, which ignores selected color and variant. CartPage passes the base product ID to those actions. Adding two colors is supported by `isSameCartItem`, but changing/removing one row does not use that identity.

Browser reproduction: seed two colors of one product, remove the first row; both disappear. Source: `src/context/AppContext.jsx:993`, `:1023`; `src/views/CartPage.jsx:330`, `:342`, `:358`.

## P1 — Partner withdrawals have incompatible balance/response handling

- The partner screen validates `withdrawableCoins`/`walletCoins`; `requestPayout` instead checks `walletCash`. The server endpoint deducts `walletCoins`. A user with 2,000 withdrawable coins and no walletCash is blocked from requesting 1,000 coins. Reproduced by evaluating the actual function with isolated state and no network calls.
- `handleWithdrawSubmit` does not await the async request. A Promise is truthy, so it clears the amount and payment details even when the request resolves to false. Reproduced using the actual handler and an async failing stub.
- On HTTP success, the client sets user state to `data.user`, but the native API returns `{ success, message, remainingCoins }` without a user object. This can clear the profile state rather than update the balance; confirmed by comparing caller/callee source contracts, not a real payout.

Sources: `src/views/PartnerCenter.jsx:51`, `:71`; `src/context/AppContext.jsx:1248`, `:1264`; `src/app/api/payouts/route.js:120`. Evidence: `payout-proof.json`.

## P2 — Successful payment receipt expects details the API does not return

The GET verification endpoint returns `success`, `status`, and `orderId`, but the return page sets orderDetails from `data.order` and displays `orderDetails?.totalPrice || 0`. A successful native response therefore has no amount to display and falls back to ₹0.

Sources: `src/app/checkout/return/page.jsx:37`, `:99`; GET handler in `src/app/api/payments/cashfree/verify/route.js`. Reproduction uses the existing native response shape in a browser fixture; no real payment is created or verified.

## P2 — Product fallback drops search, seller, and pagination constraints

When database lookup throws, `/api/products` filters the fallback catalog only by category, disregarding search and seller. Both fallback branches use `.slice(0, limit)` instead of slicing the requested page. During an outage, search can return unrelated products, seller storefronts can show unrelated fallback inventory, and later pages can repeat the first page.

Source: `src/app/api/products/route.js:113`, `:130`, `:136`. Confirmed by code inspection; no database outage or live inventory changes were deliberately triggered.

## Coverage and limitations

- Parsed all 267 JavaScript/JSX/MJS/CJS source files under `src`, `server`, and `api`: no syntax failures.
- Enumerated all 36 static app page routes against the production build: 34 returned HTTP 200; `/catalog` and `/search` exceeded the 8-second HTTP budget in this environment. Both await database queries during server rendering; database connectivity/latency needs a separate operational check. HTTP smoke results are saved in `extended-results.json`; this does not validate every interaction on each page.
- Inspected frontend cart, partner payouts, payment return, wishlist, product catalog, checkout, API auth, products, cart/sync, payouts, search, shipping, orders/returns, seller products, server payment routes and product/coupon helpers.
- The first four bugs passed targeted browser reproduction after fixes; production Webpack build completed successfully with database connectivity warnings during static generation.
- The final production-browser run passed all five regression assertions for homepage/catalog rendering, saved cart hydration, a single purchase bar and the session endpoint.
- Local browser navigation was intermittently slow; aborts/timeouts alone are not treated as confirmed website bugs.
- Signed-in admin/seller/order workflows, real payouts/payments, courier dispatch and external notifications were not exercised. Dynamic blog/product permutations were not exhaustively tested.
- This is a broad functional audit, not proof that the project has no other bugs and not a dedicated security audit.
