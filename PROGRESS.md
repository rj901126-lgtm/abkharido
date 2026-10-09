# ABKHARIDO IMPLEMENTATION TRACKER

## Current State
- **Current Patch**: Patch 3 Completed | Starting Patch 4 (Shopping Flows)
- **Status**: Patch 3 DONE (Tested & Verified)
- **Active Git Branch**: `implementation-audit-patches`
- **Working Tree**: Migration & backups preserved (`backups/catalogue_backup_before_patch2_2026-10-09T17-58-45-606Z.json`)

---

## Completed Patches
- **Patch 0 (Baseline & Questionnaire)**: DONE (Committed `f007177`)
- **Patch 1 (P0 Security, Money & Access Controls)**: DONE (Committed `866cd2c`)
- **Patch 2 (Catalogue Purge, Brand Safety & Trust Cleanse)**: DONE (Committed `f128803`)
- **Patch 3 (Product Data & Publishing)**: DONE
  - **3.1 Product Field Validation Rules**: Enforced stable ID, human name, description, category, integer price, integer stock, at least 1 real image. `inStock` strictly derived from `stock > 0`.
  - **3.2 Public DTO Sanitization**: `reviewsCount` and `rating` strictly computed from real review documents (0 fallback, hardcoded 4.5 removed). Stripped internal commission rates, cost prices, vendor IDs. Filtered placeholder images.
  - **3.3 Status Lifecycle & Admin Authority**: Statuses `['draft', 'review', 'published', 'archived']`. Admin-only publishing gate. Audit trail logging on create/update. Draft and review products return 404 to public users.
  - **3.4 Honest Empty State**: Verified resilient empty search/filter states without synthetic product seeding.
  - **3.5 Dynamic Sitemap Integrity**: Filtered out draft, review, and archived products from `sitemap.xml`. `lastModified` uses `updatedAt`.
  - **3.6 Migration & Rollback**: `scripts/migrate_patch3_products.mjs` with `--rollback` and pre-migration backup.
  - **3.7 Verification**:
    - `node scripts/test_patch3_products.mjs`: 26/26 PASSED (Exit 0)
    - `node scripts/test_patch2_catalogue.mjs`: 101/101 PASSED (Exit 0)
    - `node scripts/test_patch1_security.mjs`: 36/36 PASSED (Exit 0)
    - `npm run lint`: 0 errors (Exit 0)
    - Report: `reports/03_products.md`

---

## Active Patch: Patch 4 (Shopping Flows)
- **Goal**:
  - 4.1 Search: Support search over published products by name and category with true empty state.
  - 4.2 Listing: Skeleton loading, filter/sort/pagination, accurate counts from query, breadcrumbs. Hide Compare until at least 1 published product has specs.
  - 4.3 Product Page: Stars only when review documents exist; stock from server; discount badge only when server originalPrice > price; warranty only when warrantyMonths > 0; gallery; pincode result; links to real policy pages; reviews limited to verified purchases. Related products only from published in-stock items.
  - 4.4 Shipping serviceability: Unified method for serviceable / COD allowed / delivery estimate from real source.
  - 4.5 Checkout: 3 steps, summary numbers from server, coupon and coins validated server-side, stock re-check, block double submit, distinct failure/cancelled/success states.
  - 4.6 Prevent catalog drift between static HTML and API.
  - 4.7 Regression test suite on test DB.
- **Stop Points Ahead**: S3 (Before any production deploy, credential rotation, or git history rewrite).
