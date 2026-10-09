# ABKHARIDO IMPLEMENTATION TRACKER

## Current State
- **Current Patch**: Patch 0 (Safety, Discovery, Baseline, Questionnaire)
- **Status**: STOP POINT S0 (Awaiting user review and "continue" signal)
- **Active Git Branch**: `implementation-audit-patches`
- **Working Tree**: Clean

---

## Patch 0 Summary
- **Environment Gate**: PASSED. Database is local/in-memory test MongoDB (`127.0.0.1:57480`), Cashfree is sandbox (`CASHFREE_PROD="false"`), no production secrets in environment.
- **Discovery**: Completed. 58 Next.js API routes, Express fallback, 11 Mongoose models, auth providers, seeds, and client callers cataloged.
- **Baseline Executed**:
  - `npm run lint` (`npx oxlint@latest`): Exit code 0 (673 warnings, 0 errors, 321 files).
  - `npx tsc --noEmit`: Exit code 1 (NOT APPLICABLE: pure JavaScript project without tsconfig).
  - `npm run build` (`next build`): Exit code 0 (50/50 static and dynamic routes compiled).
- **Hypotheses Audited**: 1A (reset route), 1B (coupon math & missing bot codes), 1C (order price priority), 1D (COD ₹15k cap), 1E (unauthenticated payment verify & simulation), 1F (1,000 coins & 8-day lock), 1G (unauthenticated user lookup), 1J (public bot config & fake stats) were all reproduced and confirmed in code.
- **Deliverables**:
  - `/reports/00_baseline.md` generated.
  - `PROGRESS.md` generated.

---

## Decisions Needed (Business Questionnaire — STOP POINT S0)
1. **SKUs & Brands**: Authorized brands in writing, validity of `signature-wireless-earphone` / `sigboom-21` inventory `[OWNER TO CONFIRM]`.
2. **Legal & Compliance**: Entity name, CIN/GSTIN, physical address, grievance officer contact `[OWNER TO CONFIRM]`.
3. **Policies**: Shipping, Return/Refund, Privacy, Terms legal copy `[OWNER TO CONFIRM]`.
4. **Limits**: COD limit (₹15,000), Coin lock (8 days), Payout threshold (1,000 coins), Pincode serviceability source `[OWNER TO CONFIRM]`.

---

## How to Resume
When the user sends `"continue"`, start **Patch 1** (Sub-patches 1A through 1K in order):
1. **1A**: Remove reachable reset switch (`/api/reset`) and cold-boot automated seed.
2. **1B**: Server-authoritative coupon validation (clamp [0, server subtotal], ignore client cartValue).
3. **1C**: Server-authoritative order pricing (DB unit price, reject out of stock, reject forged prices).
4. **1D**: Enforce COD cap server-side, keep COD unpaid.
5. **1E**: Harden payment verification (auth required, no simulated success in prod, idempotent).
6. **1F**: Payouts & coin debits atomic and server-enforced.
7. **1G**: Fix user IDOR, require auth, prevent enumeration.
8. **1H**: Set `Cache-Control: private, no-store` on money & user routes.
9. **1I**: Dedicated route rate limits.
10. **1J**: Strip fake bot claims & require admin auth for bot config.
11. **1K**: Input validation, sanitize sensitive fields (`influencerCommissionRate`), audit headers.
