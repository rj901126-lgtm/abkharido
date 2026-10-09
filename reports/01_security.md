# Patch 1 Security, Money & Access Audit Report

**Date:** 2026-10-09  
**Branch:** `implementation-audit-patches`  
**Status:** DONE  
**Stop Point:** S1 (End of Patch 1 — Awaiting "continue" from user before Patch 2)

---

## 1. Summary of Changes (Sub-patches 1A through 1K)

| Sub-patch | Target File(s) | Description | Status |
| :--- | :--- | :--- | :--- |
| **1A: Reset Switch & Auto-Seed** | `server/routes/legacyRoutes.js`<br>`server/config/db.js`<br>`src/lib/connectDB.js`<br>`src/context/AppContext.jsx`<br>`src/components/Navbar.jsx` | Removed `POST /api/reset` endpoint; removed `resetDatabase()` from AppContext and Navbar; eliminated cold-boot `seedDatabaseIfEmpty()` execution. | DONE |
| **1B: Coupon Validation** | `src/lib/couponValidator.js`<br>`src/app/api/coupons/validate/route.js` | Built centralized validator clamping discount to `[0, serverSubtotal]`. Client `cartValue` is discarded; discount recomputed from DB items. Rejects negative subtotals, enforcing min order value (₹499). | DONE |
| **1C: Pricing & Stock Enforcement** | `src/app/api/orders/route.js`<br>`src/app/api/payments/cashfree/create-order/route.js` | Server re-resolves items against MongoDB `Product`. Verifies stock, rejects out-of-stock items, rejects forged prices. Expired flash sales (`endTime < now`) fall back to standard DB price. | DONE |
| **1D: COD Cap** | `src/app/api/orders/route.js`<br>`src/app/api/payments/cashfree/create-order/route.js` | Enforced maximum order cap of ₹15,000 for Cash on Delivery (`[MIRROR OF CURRENT UI/CODE — OWNER TO CONFIRM]`). COD orders are strictly recorded with `isPaid: false`. | DONE |
| **1E: Payment Verification Hardening** | `src/app/api/payments/cashfree/verify/route.js` | Requires caller authentication; non-owners/anonymous callers receive generic pending response without leaking order existence; simulation disabled in production; atomic concurrency update (`findOneAndUpdate({ _id, isPaid: false })`). `GET` made read-only. | DONE |
| **1F: Wallet Coin Payouts** | `src/app/api/payouts/route.js` | Dedicated server-authoritative payouts endpoint. Debits ONLY authenticated user; enforces 1,000 coin minimum threshold and 8-day lock on newly earned coins; atomic `$inc: { walletCoins: -coins }`. | DONE |
| **1G: User IDOR & Privilege Escalation** | `src/app/api/users/[...params]/route.js` | User profile lookups require authentication; non-owners receive sanitized public card with no phone/email/wallet; mass-assignment of `role`, `walletCoins`, or `sellerStatus` blocked in update handler. | DONE |
| **1H: Cache-Control Headers** | `next.config.mjs`<br>All money & user API routes | Configured `Cache-Control: private, no-store, no-cache, must-revalidate` for all `/api/:path*` routes in `next.config.mjs` and individual API route responses. | DONE |
| **1I: Dedicated Route Rate Limiting** | `src/lib/rateLimiter.js`<br>`src/app/api/auth/verify-otp/route.js`<br>`src/app/api/coupons/validate/route.js`<br>`src/app/api/orders/route.js`<br>`src/app/api/payments/cashfree/verify/route.js` | Lightweight in-memory rate limiting applied on brute-force vectors: OTP verification (5/min), coupon validation (30/5min), order placement (15/5min), payment verification (20/5min). | DONE |
| **1J: Support Bot Hardening** | `src/app/api/admin/bot-config/route.js`<br>`src/components/SmartSupportBot.jsx` | `GET /api/admin/bot-config` requires admin authentication; removed fabricated stats (`1428 conversations`, `98.2% satisfaction`) and unverified air delivery claims; removed dead coupons (`FIRSTBUY`, `ABVIP500`) and fixed runtime crash (`total` reference error). | DONE |
| **1K: Sensitive Field Sanitization & Audit** | `src/app/api/products/route.js`<br>`src/app/api/products/[id]/route.js` | Serialized all product responses through `toPublicProductDTO`, explicitly omitting `influencerCommissionRate` and `userCommissionRate`. Captured `npm audit`. | DONE |

---

## 2. Verification & Test Evidence

### A. Dedicated Regression Test Suite (`scripts/test_patch1_security.mjs`)
- **Command:** `node scripts/test_patch1_security.mjs`
- **Exit Code:** `0`
- **Output:**
```text
================================================================
🔒 ABKHARIDO PATCH 1: P0 SECURITY, MONEY & ACCESS REGRESSION SUITE
================================================================

--- Test 1A: Database Reset & Auto-Seed Removal ---
✅ [PASS] 1A.1: server/routes/legacyRoutes.js has no /reset endpoint
✅ [PASS] 1A.2: src/context/AppContext.jsx has no resetDatabase export
✅ [PASS] 1A.3: src/components/Navbar.jsx has no resetDatabase button/caller
✅ [PASS] 1A.4: src/lib/connectDB.js has no automatic seedDatabaseIfEmpty call
✅ [PASS] 1A.5: server/config/db.js has no automatic seedDatabaseIfEmpty call

--- Test 1B: Server-Authoritative Coupon Math ---
✅ [PASS] 1B.1: SAVE10 applies 10% discount on ₹1000 subtotal (₹100 discount)
✅ [PASS] 1B.2: Negative subtotal rejects coupon and clamps discount to 0
✅ [PASS] 1B.3: Subtotal below minimum order requirement (₹499) is rejected
✅ [PASS] 1B.4: Unknown coupon code is rejected

--- Test 1C: Server-Authoritative Pricing & Stock Checks ---
✅ [PASS] 1C.1: Normal product billed at database price (₹2499)
✅ [PASS] 1C.2: Expired flash sale is ignored and bills normal database price (₹1500, not ₹199)
✅ [PASS] 1C.3: Active unexpired flash sale applies promotional flash price (₹499)
✅ [PASS] 1C.4: Quantity within available stock is accepted
✅ [PASS] 1C.5: Quantity exceeding available stock (10 > 5) is rejected
✅ [PASS] 1C.6: Out-of-stock product is rejected

--- Test 1D: COD Cap & Status Rules ---
✅ [PASS] 1D.1: COD order under ₹15,000 is allowed
✅ [PASS] 1D.2: COD order over ₹15,000 is rejected
✅ [PASS] 1D.3: COD order is strictly marked unpaid (isPaid: false)

--- Test 1E: Cashfree Payment Verification Security ---
✅ [PASS] 1E.1: Verification requires caller authentication
✅ [PASS] 1E.2: Unconditional simulation bypass removed; production simulation strictly prohibited
✅ [PASS] 1E.3: Unauthorized or unknown orders return uniform generic response (anti-enumeration)
✅ [PASS] 1E.4: Atomic state transition prevents concurrent double-verification

--- Test 1F: Wallet Coin Payout Rules ---
✅ [PASS] 1F.1: Minimum 1,000 coins threshold enforced in payouts API
✅ [PASS] 1F.2: 8-day lock period enforced on newly earned coins
✅ [PASS] 1F.3: Atomic coin deduction via findOneAndUpdate prevents race conditions

--- Test 1G: User IDOR Protection ---
✅ [PASS] 1G.1: User profile lookup requires authentication
✅ [PASS] 1G.2: Third-party lookup strictly sanitizes phone, email, and wallet coins from response
✅ [PASS] 1G.3: Mass-assignment protected (role and walletCoins cannot be escalated via user update)

--- Test 1I: Route Rate Limiting ---
✅ [PASS] 1I.1: Route rate limiter permits up to maxRequests (20) and blocks on request 21

--- Test 1J: Support Bot Hardening ---
✅ [PASS] 1J.1: Admin bot configuration GET requires admin authentication
✅ [PASS] 1J.2: Fabricated stats (1428 conversations) removed from bot config
✅ [PASS] 1J.3: Unverified next-day metro air delivery claim removed
✅ [PASS] 1J.4: Dead coupons (FIRSTBUY, ABVIP500) removed from SmartSupportBot
✅ [PASS] 1J.5: Unverified express claims removed from SmartSupportBot

--- Test 1K: Sensitive Data Sanitization & Security Headers ---
✅ [PASS] 1K.1: influencerCommissionRate omitted from public products DTO
✅ [PASS] 1K.2: API routes secured with private no-store Cache-Control in next.config.mjs

================================================================
📊 PATCH 1 TEST RESULTS: 36 PASSED | 0 FAILED
================================================================
```

### B. Lint Check
- **Command:** `npm run lint` (`npx oxlint@latest`)
- **Exit Code:** `0`
- **Output:** `Found 665 warnings and 0 errors. Finished in 582ms on 324 files.` (Warnings reduced from baseline 673).

### C. Build Check
- **Command:** `npm run build` (`next build`)
- **Exit Code:** `0`
- **Output:** `✓ Compiled successfully in 17.2s ... Generating static pages using 4 workers (50/50) in 27.9s ... Finalizing page optimization ...`
- Route manifest confirms:
  - No `/api/reset` route in compiled bundle.
  - New `/api/payouts` endpoint compiled (`ƒ /api/payouts`).
  - All 50 application pages and routes valid.

### D. Dependency Vulnerability Audit (`npm audit`)
- **Command:** `npm audit --audit-level=high`
- **Exit Code:** `1`
- **Summary:** 28 vulnerabilities reported (10 moderate, 15 high, 3 critical) originating from nested upstream dependencies (`next` 16.2.11, `nodemailer`, `uuid`, `shell-quote`, `nanoid`). Breaking fixes defer to dependency upgrade patch.

---

## 3. Decisions & Confirmations Pending Owner Input

1. **COD Cap (₹15,000)**: Enforced across code and UI. `[OWNER TO CONFIRM: Keep or modify ₹15,000 threshold]`
2. **Coin Lock Duration (8 days)**: Enforced in payouts API. `[OWNER TO CONFIRM: Keep or modify 8-day lock]`
3. **Coin Payout Minimum (1,000 coins)**: Enforced in payouts API. `[OWNER TO CONFIRM: Keep or modify 1,000 coins]`
4. **Authorized SKUs & Brands**: `[OWNER TO CONFIRM: Authorizations for branded electronics]`

---

## 4. Next Steps
- This patch concludes at **STOP POINT S1**.
- Do not begin Patch 2 until user replies `"continue"`.
