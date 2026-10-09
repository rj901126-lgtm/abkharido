# ABKHARIDO IMPLEMENTATION TRACKER

## Current State
- **Current Patch**: Patch 1 (P0 Money and Access — Sub-patches 1A through 1K)
- **Status**: STOP POINT S1 (Awaiting user review and "continue" signal before Patch 2)
- **Active Git Branch**: `implementation-audit-patches`
- **Working Tree**: Tested & Verified (36/36 regression tests passing)

---

## Patch 1 Summary
- **1A (Reset / Seed Wipe)**: Removed `POST /api/reset` from `server/routes/legacyRoutes.js`; removed `resetDatabase()` from AppContext & Navbar; removed cold-boot `seedDatabaseIfEmpty()` execution.
- **1B (Coupons)**: Implemented server-authoritative `src/lib/couponValidator.js`. Discarded client `cartValue`; recomputed from DB items; clamped discounts strictly to `[0, serverSubtotal]`.
- **1C (Pricing & Stock)**: Orders resolve directly against MongoDB `Product`. Cart items verified against live stock; forged prices rejected; expired flash sales fallback to standard DB price.
- **1D (COD Cap)**: Server-side ₹15,000 cap enforced on COD orders in orders and Cashfree route (`[OWNER TO CONFIRM]`). COD orders are strictly recorded unpaid (`isPaid: false`).
- **1E (Payment Verify)**: Hardened `/api/payments/cashfree/verify`. Requires auth; non-owners/anonymous callers receive uniform generic pending responses; simulation disabled in production; atomic concurrency update (`findOneAndUpdate({ _id, isPaid: false })`).
- **1F (Payouts & Wallet Coins)**: Created server-authoritative `/api/payouts`. Requires auth; debits ONLY token user; enforces 1,000 coins minimum threshold and 8-day lock on newly earned coins; atomic `$inc: { walletCoins: -coins }`.
- **1G (Users, IDOR, Roles)**: Hardened `/api/users/[...params]`. Lookups require auth; non-owners receive sanitized public card with no phone/email/wallet; mass-assignment of `role`, `walletCoins`, and `sellerStatus` blocked in update POST.
- **1H (Caching)**: Set `Cache-Control: private, no-store, no-cache, must-revalidate` in `next.config.mjs` for all `/api/:path*` routes and individual sensitive responses.
- **1I (Rate Limiting)**: Created `src/lib/rateLimiter.js`. Integrated on `auth/verify-otp` (5/min), `coupons/validate` (30/5min), `orders` (15/5min), and `payments/cashfree/verify` (20/5min).
- **1J (Support Bot)**: Secured `GET /api/admin/bot-config` with admin auth; removed fake stats (`1428 conversations`) and unverified air claims; removed dead coupons (`FIRSTBUY`, `ABVIP500`) and fixed runtime crash in `SmartSupportBot.jsx`.
- **1K (Hardening & Audits)**: Product endpoints serialized via `toPublicProductDTO`, omitting internal `influencerCommissionRate` and `userCommissionRate`. Captured `npm audit`.

---

## Test & Build Execution (Real Output)
- **Regression Suite**: `node scripts/test_patch1_security.mjs` -> **36 PASSED, 0 FAILED** (Exit Code: 0).
- **Linter**: `npm run lint` -> **665 warnings, 0 errors** (Exit Code: 0).
- **Production Build**: `npm run build` -> **Compiled 50/50 static and dynamic routes** (Exit Code: 0).

---

## Decisions Needed (Business Confirmations)
1. **COD Cap (₹15,000)**: Enforced across code and UI. `[OWNER TO CONFIRM: Keep or modify ₹15,000 threshold]`
2. **Coin Lock Duration (8 days)**: Enforced in payouts API. `[OWNER TO CONFIRM: Keep or modify 8-day lock]`
3. **Coin Payout Minimum (1,000 coins)**: Enforced in payouts API. `[OWNER TO CONFIRM: Keep or modify 1,000 coins]`
4. **Authorized SKUs & Brands**: `[OWNER TO CONFIRM: Authorizations for branded electronics]`

---

## How to Resume
When the user sends `"continue"` after STOP POINT S1, proceed to **Patch 2 (Catalogue, Inventory & Trust Audit)**:
1. Generate catalogue inventory report of existing products.
2. Prepare product purge/archive table for unverified or duplicate branded SKUs.
3. Pause at **STOP POINT S2** before archiving/unpublishing any products.
