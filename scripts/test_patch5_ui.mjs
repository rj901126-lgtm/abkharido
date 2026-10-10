import fs from 'fs';
import path from 'path';

let passed = 0;
let failed = 0;
const results = [];

function assert(condition, testName, details = '') {
  if (condition) {
    passed++;
    console.log(`✅ [PASS] ${testName} ${details ? '(' + details + ')' : ''}`);
    results.push({ name: testName, status: 'PASS', details });
  } else {
    failed++;
    console.error(`❌ [FAIL] ${testName} ${details ? '(' + details + ')' : ''}`);
    results.push({ name: testName, status: 'FAIL', details });
  }
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('🎨 ABKHARIDO PATCH 5: UI DESIGN TOKENS, STICKY HEADER & LAYOUT');
  console.log('================================================================\n');

  // ---------------------------------------------------------------------------
  // 1. DESIGN TOKENS & CSS VARIABLES (variables.css)
  // ---------------------------------------------------------------------------
  console.log('--- 1. Design Tokens & Visual Hierarchy ---');
  const varsPath = path.resolve('src/assets/styles/variables.css');
  assert(fs.existsSync(varsPath), 'variables.css exists');
  const varsContent = fs.readFileSync(varsPath, 'utf8');

  assert(varsContent.includes('--brand-accent: #2563eb'), 'Unified brand accent set to #2563eb');
  assert(varsContent.includes('--brand-accent-hover: #1d4ed8'), 'Brand accent hover token defined');
  assert(varsContent.includes('--touch-target-min: 44px'), 'Minimum touch target token --touch-target-min: 44px defined');

  // Type scale verification
  const typeTokens = ['--font-xs', '--font-sm', '--font-base', '--font-lg', '--font-xl', '--font-2xl', '--font-3xl', '--font-4xl'];
  const allTypeTokensPresent = typeTokens.every(tok => varsContent.includes(tok));
  assert(allTypeTokensPresent, 'Full type scale tokens present (--font-xs to --font-4xl)');

  // 8px Spacing scale verification
  const spaceTokens = ['--space-1: 4px', '--space-2: 8px', '--space-3: 12px', '--space-4: 16px', '--space-6: 24px', '--space-8: 32px', '--space-16: 64px'];
  const allSpaceTokensPresent = spaceTokens.every(sp => varsContent.includes(sp));
  assert(allSpaceTokensPresent, 'Strict 8px spacing grid tokens defined (--space-1 through --space-16)');

  // Shared component classes
  assert(varsContent.includes('.ui-btn') && varsContent.includes('.ui-btn-primary'), 'Shared .ui-btn classes defined');
  assert(varsContent.includes('.ui-card'), 'Shared .ui-card class defined');
  assert(varsContent.includes('.ui-input'), 'Shared .ui-input class defined');
  assert(varsContent.includes('.ui-form-error'), 'Shared .ui-form-error class defined');

  // Check no default indigo #4338ca in variables.css
  assert(!varsContent.includes('#4338ca'), 'Default indigo #4338ca absent from tokens');

  // ---------------------------------------------------------------------------
  // 2. ACCENT COLOR PURGE ACROSS ROOT LAYOUTS
  // ---------------------------------------------------------------------------
  console.log('\n--- 2. Unified Brand Accent in Layouts ---');
  const layoutPath = path.resolve('src/app/layout.jsx');
  const layoutContent = fs.readFileSync(layoutPath, 'utf8');
  assert(layoutContent.includes("themeColor: '#2563eb'") || layoutContent.includes('themeColor: "#2563eb"'), 'layout.jsx themeColor set to #2563eb');
  assert(!layoutContent.includes('#4f46e5'), 'layout.jsx cleansed of default indigo #4f46e5');

  const clientLayoutPath = path.resolve('src/components/ClientLayout.jsx');
  const clientLayoutContent = fs.readFileSync(clientLayoutPath, 'utf8');
  assert(clientLayoutContent.includes("themeColor: '#2563eb'"), 'ClientLayout.jsx themeColor set to #2563eb');
  assert(!clientLayoutContent.includes('#2874f0'), 'ClientLayout.jsx cleansed of Flipkart clone #2874f0');

  // ---------------------------------------------------------------------------
  // 3. STICKY HEADER & 44PX MOBILE TARGETS (navbar.css)
  // ---------------------------------------------------------------------------
  console.log('\n--- 3. Sticky Header & 44px Touch Targets ---');
  const navCssPath = path.resolve('src/assets/styles/navbar.css');
  const navCssContent = fs.readFileSync(navCssPath, 'utf8');

  // Sticky header verification
  assert(navCssContent.includes('position: fixed !important') || navCssContent.includes('position: sticky'), 'Header sticky/fixed positioning enforced');
  assert(navCssContent.includes('.nav-item-btn') && navCssContent.includes('min-height: 44px !important'), '.nav-item-btn enforces 44px minimum touch target on mobile');
  assert(navCssContent.includes('.cart-item') && navCssContent.includes('min-height: 44px !important'), '.cart-item enforces 44px minimum touch target on mobile');
  assert(navCssContent.includes('.search-form') && navCssContent.includes('min-height: 44px !important'), '.search-form enforces 44px minimum touch target on mobile');
  assert(navCssContent.includes('.delivery-pincode-badge') && navCssContent.includes('min-height: 44px !important'), '.delivery-pincode-badge enforces 44px minimum touch target on mobile');
  assert(navCssContent.includes('.user-profile-pill') && navCssContent.includes('min-height: 44px !important'), '.user-profile-pill enforces 44px minimum touch target on mobile');

  // ---------------------------------------------------------------------------
  // 4. NAVBAR DYNAMIC CATEGORY FILTERING & HONEST SEARCH
  // ---------------------------------------------------------------------------
  console.log('\n--- 4. Navbar Integrity & Lucide Icons ---');
  const navbarPath = path.resolve('src/components/Navbar.jsx');
  const navbarContent = fs.readFileSync(navbarPath, 'utf8');

  // Dynamic category filtering
  assert(navbarContent.includes('availableMegaCategories'), 'Navbar computes availableMegaCategories dynamically');
  assert(navbarContent.includes('Number(p.stock) > 0') || navbarContent.includes('p.inStock'), 'Category display strictly filters for in-stock products');
  assert(navbarContent.includes("status === 'published'") || navbarContent.includes("status === 'active'"), 'Category display strictly filters for published/active products');

  // Honest search placeholders (no unapproved phantom brands)
  assert(!navbarContent.includes('iPhone 16 Pro'), 'Navbar search placeholders cleansed of unapproved brand "iPhone 16 Pro"');
  assert(!navbarContent.includes('Nike Air Jordan'), 'Navbar search placeholders cleansed of unapproved brand "Nike Air Jordan"');
  assert(!navbarContent.includes('Spatial AirPods'), 'Navbar search placeholders cleansed of unapproved brand "Spatial AirPods"');

  // ---------------------------------------------------------------------------
  // 5. HOMEPAGE CLEANSE & HONEST PROMOTIONS
  // ---------------------------------------------------------------------------
  console.log('\n--- 5. Homepage Cleanse & Category Strip ---');
  const homePath = path.resolve('src/views/Home.jsx');
  const homeContent = fs.readFileSync(homePath, 'utf8');

  // Verified removal of fake merchant stores
  assert(!homeContent.includes('Apex Audio Labs'), 'Fake merchant store "Apex Audio Labs" deleted from Home.jsx');
  assert(!homeContent.includes('AbKharido Couture'), 'Fake merchant store "AbKharido Couture" deleted from Home.jsx');
  assert(!homeContent.includes('Verified Merchant Stores Spotlight'), 'Fake merchant stores spotlight section deleted');

  // Dynamic category strip on homepage
  assert(homeContent.includes('activeVipCategories'), 'Home.jsx dynamically derives activeVipCategories from published stock');
  assert(homeContent.includes('Number(p.stock) > 0') || homeContent.includes('p.inStock'), 'Home.jsx category strip filters for in-stock products');
  assert(homeContent.includes('signature-wireless-earphone'), 'Home.jsx features real published keeper product');

  // ---------------------------------------------------------------------------
  // 6. MOBILE PDP SINGLE STICKY BOTTOM BAR (ProductDetails.jsx)
  // ---------------------------------------------------------------------------
  console.log('\n--- 6. Mobile PDP Sticky Bottom Bar Integrity ---');
  const pdpPath = path.resolve('src/views/ProductDetails.jsx');
  const pdpContent = fs.readFileSync(pdpPath, 'utf8');

  assert(pdpContent.includes('mobile-sticky-cart-bar'), 'ProductDetails.jsx implements .mobile-sticky-cart-bar');
  assert(pdpContent.includes('mobile-sticky-cart-price'), 'Mobile sticky bar displays current price and MRP');
  assert(pdpContent.includes('mobile-sticky-cart-btn-add'), 'Mobile sticky bar includes Add to Bag / Cart action');
  assert(pdpContent.includes('mobile-sticky-cart-btn-buy'), 'Mobile sticky bar includes Buy Now action');

  // Single sticky bar constraint (Zero collision)
  assert(
    clientLayoutContent.includes("!pathname?.startsWith('/product')") ||
    clientLayoutContent.includes("isProductPage"),
    'ClientLayout ensures bottom navigation / support bots are excluded on PDP (strictly <= 1 sticky bottom bar)'
  );

  // ---------------------------------------------------------------------------
  // 7. ERROR BOUNDARIES & 404/500 PAGES
  // ---------------------------------------------------------------------------
  console.log('\n--- 7. Error Boundaries & 404/500 States ---');
  const globalErrorPath = path.resolve('src/app/global-error.jsx');
  assert(fs.existsSync(globalErrorPath), 'global-error.jsx (500 boundary) exists');
  const globalErrorContent = fs.readFileSync(globalErrorPath, 'utf8');
  assert(globalErrorContent.includes('Server Error (500)'), 'global-error.jsx identifies 500 error state');
  assert(globalErrorContent.includes('Reference ID:'), 'global-error.jsx displays diagnostic Reference ID');
  assert(globalErrorContent.includes('reset()') || globalErrorContent.includes('reset'), 'global-error.jsx includes retry reset handler');

  const notFoundPath = path.resolve('src/app/not-found.jsx');
  assert(fs.existsSync(notFoundPath), 'not-found.jsx (404 state) exists');
  const notFoundContent = fs.readFileSync(notFoundPath, 'utf8');
  assert(notFoundContent.includes('HTTP 404 — Item Not Found'), 'not-found.jsx displays 404 header');
  assert(notFoundContent.includes('handleSearchSubmit'), 'not-found.jsx includes search recovery action');
  assert(!notFoundContent.includes('📱') && !notFoundContent.includes('🎧'), 'not-found.jsx uses Lucide icons instead of emojis');

  // ---------------------------------------------------------------------------
  // 8. PLAYWRIGHT JOURNEY TEST
  // ---------------------------------------------------------------------------
  console.log('\n--- 8. Journey Test Suite (5.6) ---');
  const journeyPath = path.resolve('tests/journey.spec.js');
  assert(fs.existsSync(journeyPath), 'tests/journey.spec.js exists');
  const journeyContent = fs.readFileSync(journeyPath, 'utf8');
  assert(journeyContent.includes("signature"), 'journey.spec.js tests search for keeper keyword "signature"');
  assert(journeyContent.includes("signature-wireless-earphone"), 'journey.spec.js verifies navigation to keeper PDP');
  assert(journeyContent.includes("/cart"), 'journey.spec.js verifies add to cart and cart view');

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
