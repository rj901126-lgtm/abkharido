# Baseline Report (Patch 0) — AbKharido Architecture & Security Audit

**Date**: 2026-10-09  
**Branch**: `implementation-audit-patches`  
**Repository**: `abkharido` (Next.js 16 + Express backend)  

---

## 0.1 Environment Gate

| Parameter | Observed Value | Classification / Status |
|---|---|---|
| **Database Host** | `127.0.0.1:57480` (configured in `.env`) | Verified Local/Non-Production |
| **Database Name / In-Memory** | Dynamic `MongoMemoryServer` fallback in `src/lib/connectDB.js` | Verified Non-Production |
| **Cashfree Mode** | `CASHFREE_PROD="false"` | Sandbox / TEST Mode |
| **Cashfree App ID** | `TEST110175944d6e41ef6e32adf9edb149571011` | Verified Sandbox Key |
| **Cloudinary Cloud Name** | `rx1klbob` (referenced in `src/db/mockData.js`) | Asset CDN host |
| **Production Gate Status** | **PASSED** — No live production database or live PG secrets present in local environment. |

> **Critical Discovery**: `src/lib/connectDB.js` imports `server/utils/seed.js` and invokes `seedDatabaseIfEmpty()`, automatically populating an empty database with 26+ mock products on cold connect. This must be neutralized in Patch 1A.

---

## 0.2 Architecture & Codebase Discovery

### 1. API Handlers & Routing
- **Next.js App Router (58 Routes)**: Located in `src/app/api/` covering `admin`, `audit-logs`, `auth` (NextAuth & OTP), `cart`, `cms`, `coupons`, `orders`, `payments/cashfree`, `products`, `seller`, `shipping/nimbuspost`, `staff`, `stats`, `tickets`, `users`, `wishlist`.
- **Express Backend**: Defined in `server/app.js` (port 5000 fallback), mounting controllers in `server/controllers/` and routes in `server/routes/`.
- **Legacy Route Switch**: `server/routes/legacyRoutes.js` exposes `POST /api/reset`, which is called by `src/context/AppContext.jsx` line 214.

### 2. Middleware & Protection
- **Security Headers**: `helmet()` mounted in `server/app.js`.
- **CORS**: Restricted to `https://www.abkharido.com`, `https://abkharido.com`, and localhost ports.
- **Sanitization**: Custom regex sanitization `sanitizeObject()` stripping `$` and `.` to block NoSQL query operator injection.
- **Rate Limiting**:
  - Global `apiLimiter`: 1,000 requests / 15 minutes (Memory/RedisStore).
  - Auth `authLimiter`: 30 requests / 15 minutes.
  - OTP `otpLimiter`: 30 requests / 15 minutes.
  - Seller `sellerLimiter`: 20 requests / 15 minutes.

### 3. Data Models
- Located in `server/models/`: `Product`, `Order`, `User`, `Coupon`, `Cart`, `Ticket`, `Review`, `Staff`, `AuditLog`, `Otp`, `Seller`.

### 4. Authentication & Roles
- **Mechanisms**: NextAuth.js Credentials Provider + Direct JWT (`JWT_SECRET`).
- **Roles**: `user`, `seller`, `admin`, `super_admin`.
- **Admin Access**: `/api/admin/verify` verifies PIN against `ADMIN_SECURE_PIN` and issues 7-day JWT cookie `abkharido_admin_token`.

### 5. Product Sources in Codebase
- **Database**: Mongoose collection `products`.
- **Seeds**: `server/data/productsData.js` (26+ dummy/brand products), `src/db/mockData.js` (includes `signature-wireless-earphone`).
- **Cold Boot Injection**: `server/utils/seed.js` invoked via `src/lib/connectDB.js`.
- **Hardcoded Category Data**: `src/utils/categoryData.js`.
- **Hardcoded Support Data**: `src/components/SmartSupportBot.jsx` and `/api/admin/bot-config`.

---

## 0.3 Baseline Command Results

| Command | Exit Code | Real Output Summary |
|---|---|---|
| `git status` | `0` | Branch `implementation-audit-patches` clean. |
| `npm run lint` (`npx oxlint@latest`) | `0` | 673 warnings, 0 errors across 321 files (1.3s). |
| `npx tsc --noEmit` | `1` | **NOT APPLICABLE** — Pure JavaScript project; no `tsconfig.json` present. |
| `npm run build` (`next build`) | `0` | Compiled successfully in 9.4s; 50/50 static and dynamic routes generated cleanly. |
| `npx playwright --version` | `0` | Playwright Version 1.62.1 installed. |
| **Lighthouse / Screenshots** | N/A | **UNABLE TO VERIFY IN BASELINE** — Lighthouse CLI not installed locally; no headless browser screenshot run in Patch 0 to avoid fabricating metrics. |

---

## 0.4 Hypotheses Pre-Verification (Patch 1 Audit)

| ID | Hypothesis | Class | File & Line Reference | Verification Finding |
|---|---|---|---|---|
| **1A** | Client calls `POST /api/reset` and toasts DB reset. | **Confirmed Defect** | `server/routes/legacyRoutes.js:12`<br>`src/context/AppContext.jsx:214` | Route exists; client caller triggers DB wipe. |
| **1B** | Coupon validate uses client `cartValue`; `SAVE10` at -5000 returns negative discount; `FIRSTBUY` & `ABVIP500` advertised but rejected. | **Confirmed Defect** | `src/app/api/coupons/validate/route.js:10-81`<br>`src/components/SmartSupportBot.jsx:367` | Accepts raw client `cartValue`, does not floor to 0, returns negative discount; advertised bot codes missing from DB/fallback. |
| **1C** | Order item price 1 not rejected; API complains about address first. | **Confirmed Defect** | `src/app/api/orders/route.js:98, 170` | Shipping address validated on lines 98-100 before item DB price lookup; fallback `prod.price \|\| item.price` allows client price tampering if product not in DB. |
| **1D** | COD cap ₹15,000 present in code/UI. | **Confirmed Mirror** | `server/controllers/orderController.js:15`<br>`src/views/Checkout.jsx:136`<br>`src/app/api/payments/cashfree/create-order/route.js:108` | Cap of ₹15,000 is mirrored across multiple server and UI files. |
| **1E** | `/api/payments/cashfree/verify` is unauthenticated; reveals order existence; simulated success path present. | **Confirmed Defect** | `src/app/api/payments/cashfree/verify/route.js:10, 23, 33` | No authentication; returns 404 for unknown IDs; accepts `cfData.simulated === true`. |
| **1F** | Payouts/wallet: 1,000 coins threshold & 8-day lock present in UI/code. | **Confirmed Mirror** | `src/views/PartnerCenter.jsx:457`<br>`server/routes/legacyRoutes.js:84`<br>`src/utils/coinUtils.js:12` | 1,000 coins min and 8-day lock exist in UI and server legacy routes. |
| **1G** | `GET /api/users/:id` without token returns "User profile not found". | **Confirmed Defect** | `src/app/api/users/[...params]/route.js:67, 173` | Unauthenticated lookup allowed; returns 404 "User profile not found", enabling account enumeration. |
| **1J** | Support bot hardcodes `SAVE10`, `FIRSTBUY`, `ABVIP500` and false delivery/warranty claims; `/api/admin/bot-config` GET is public. | **Confirmed Defect** | `src/app/api/admin/bot-config/route.js:20, 63`<br>`src/components/SmartSupportBot.jsx:367` | `/api/admin/bot-config` GET is unauthenticated; returns hardcoded fake stats (1,428 chats, 98.2% satisfaction) and unverified claims. |

---

## 0.5 Business-Input Questionnaire (STOP POINT S0)

The following items are flagged for business confirmation. In accordance with Section 0 Precedence, placeholders marked `[OWNER TO CONFIRM]` will be maintained until answered:

1. **SKUs to Keep & Brand Authorization**:
   - Are any big brands (Apple, Samsung, Sony, Nike, Levi's, Philips, LG, etc.) formally authorized in writing for AbKharido to distribute?
   - Is `signature-wireless-earphone` / `sigboom-21` genuine inventory currently held and sold by AbKharido?
   - `[OWNER TO CONFIRM: Authorized SKUs and Brands]`

2. **Legal & Compliance Entity**:
   - Registered Business / Corporate Entity Name: `[OWNER TO CONFIRM]`
   - Corporate Identity Number (CIN) & GSTIN: `[OWNER TO CONFIRM]`
   - Registered Physical Address: `[OWNER TO CONFIRM]`
   - Official Support Phone & Email: `[OWNER TO CONFIRM]`
   - Grievance Officer Contact Details: `[OWNER TO CONFIRM]`

3. **Store Policies**:
   - Official Text for Shipping & Delivery Policy: `[OWNER TO CONFIRM]`
   - Official Text for Cancellation & Refund Policy: `[OWNER TO CONFIRM]`
   - Official Text for Privacy Policy & Terms of Service: `[OWNER TO CONFIRM]`

4. **Commercial Thresholds**:
   - Confirm or adjust: COD upper order limit (Currently ₹15,000 in code): `[OWNER TO CONFIRM]`
   - Confirm or adjust: Wallet coin lock duration (Currently 8 days in code): `[OWNER TO CONFIRM]`
   - Confirm or adjust: Minimum coins required for payout (Currently 1,000 coins in code): `[OWNER TO CONFIRM]`
   - Pincode & Delivery Serviceability Source (NimbusPost / Delhivery / Static data): `[OWNER TO CONFIRM]`
