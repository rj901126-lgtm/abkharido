# ABKHARIDO IMPLEMENTATION TRACKER

## Current State
- **Current Patch**: Patch 2 Completed | Starting Patch 3 (Product Data & Publishing)
- **Status**: Patch 2 DONE (Tested & Verified)
- **Active Git Branch**: `implementation-audit-patches`
- **Working Tree**: Clean backups preserved (`backups/catalogue_backup_before_patch2_2026-10-09T17-58-45-606Z.json` — 40 records)

---

## Completed Patches
- **Patch 0 (Baseline & Questionnaire)**: DONE (Committed `f007177`)
- **Patch 1 (P0 Security, Money & Access Controls)**: DONE (Committed `866cd2c`)
- **Patch 2 (Catalogue Purge, Brand Safety & Trust Cleanse)**: DONE
  - **2.1 Inventory & Backup**: 40 records cataloged and backed up to `backups/`.
  - **2.2 S2 Purge Table Approved**: Approval received (`approve purge`).
  - **2.3 Archive Execution**: 39 unapproved SKUs archived; 0 hard-deleted; 1 keeper SKU (`signature-wireless-earphone` / `sigboom-21`) retained.
  - **2.4 404 & noindex Handling**: Verified HTTP 404 with `X-Robots-Tag: noindex, nofollow` on archived endpoints; Next.js `notFound()` and `robots: { index: false, follow: false }` metadata integrated.
  - **2.5 Keeper SKU Fixes**: Synchronized across `server/data/productsData.js`, `src/db/mockData.js`, `products.json`; reviews reset to 0; flashSale set inactive.
  - **2.6 Schema Hardening**: Added `status` and `isArchived` fields with indexes to Mongoose `Product` schema.
  - **2.7 False Claims Cleansed**: Eradicated unverified claims ("100% Genuine Brand Warranty", "Official Brand Partner", "10,000+ Happy Customers", "BUY 2 GET 1 FREE", etc.) across 13+ UI views, contexts, and metadata.
  - **2.8 Verification**:
    - `node scripts/test_patch2_catalogue.mjs`: 101/101 PASSED (Exit 0)
    - `node scripts/test_patch1_security.mjs`: 36/36 PASSED (Exit 0)
    - `npm run lint`: 0 errors (Exit 0)
    - `npm run build`: 50/50 routes compiled successfully (Exit 0)
    - Report: `reports/02_cleanup.md`

---

## Active Patch: Patch 3 (Product Data and Publishing)
- **Goal**:
  - Enforce required product fields: title, description, category, price, MRP, GST rate, HSN, stock, weight/dimensions, return policy, real images.
  - Image domain allowlist (Cloudinary only: `res.cloudinary.com`). Reject external Unsplash or arbitrary URL hotlinking on publish.
  - Admin/seller publish validation: reject products missing required fields or having stock <= 0 with status active.
  - Reviews engine: compute count and average rating strictly from approved review documents.
- **Stop Points Ahead**: S3 (Before any production deploy, credential rotation, or git history rewrite).
