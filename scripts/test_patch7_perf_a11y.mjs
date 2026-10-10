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
  console.log('⚡ ABKHARIDO PATCH 7: PERFORMANCE, ACCESSIBILITY & CLEAN BUILD');
  console.log('================================================================\n');

  // ---------------------------------------------------------------------------
  // 1. PERFORMANCE & ZERO CLS (LAYOUT SHIFT)
  // ---------------------------------------------------------------------------
  console.log('--- 1. Performance & Zero Layout Shift ---');
  const layoutContent = fs.readFileSync(path.resolve('src/app/layout.jsx'), 'utf8');
  assert(layoutContent.includes('rel="preconnect" href="https://fonts.googleapis.com"'), 'layout.jsx preconnects to Google Fonts');
  assert(layoutContent.includes('rel="preconnect" href="https://fonts.gstatic.com"'), 'layout.jsx preconnects to Google Fonts Static CDN');
  assert(layoutContent.includes('rel="dns-prefetch" href="https://sdk.cashfree.com"'), 'layout.jsx prefetches Cashfree SDK');
  assert(layoutContent.includes('rel="dns-prefetch" href="https://res.cloudinary.com"'), 'layout.jsx prefetches Cloudinary CDN');

  const lazyImgPath = path.resolve('src/components/LazyImage.jsx');
  assert(fs.existsSync(lazyImgPath), 'LazyImage component exists');
  const lazyImgContent = fs.readFileSync(lazyImgPath, 'utf8');
  assert(lazyImgContent.includes('loading="lazy"') || lazyImgContent.includes('loading={loading}'), 'LazyImage sets browser native lazy-loading');
  assert(lazyImgContent.includes('decoding="async"'), 'LazyImage sets asynchronous image decoding');
  assert(lazyImgContent.includes('objectFit'), 'LazyImage prevents aspect ratio distortion');

  // ---------------------------------------------------------------------------
  // 2. ACCESSIBILITY: WCAG 2.1 AA STANDARDS (variables.css)
  // ---------------------------------------------------------------------------
  console.log('\n--- 2. WCAG 2.1 AA Tokens & Focus States ---');
  const varsContent = fs.readFileSync(path.resolve('src/assets/styles/variables.css'), 'utf8');
  assert(varsContent.includes(':focus-visible'), 'variables.css defines visible focus rings for keyboard navigation');
  assert(varsContent.includes('--touch-target-min: 44px'), 'variables.css defines 44px minimum touch target');
  assert(varsContent.includes('.sr-only'), 'variables.css defines screen-reader only utility (.sr-only)');
  assert(varsContent.includes('prefers-reduced-motion'), 'variables.css respects user reduced-motion preference');

  // ---------------------------------------------------------------------------
  // 3. SEMANTIC ARIA LANDMARKS & LABELS
  // ---------------------------------------------------------------------------
  console.log('\n--- 3. Semantic ARIA Landmarks & Labels ---');
  const navbarContent = fs.readFileSync(path.resolve('src/components/Navbar.jsx'), 'utf8');
  assert(navbarContent.includes('role="banner"'), 'Navbar header has role="banner"');
  assert(navbarContent.includes('aria-label="Main Navigation"'), 'Navbar container has aria-label="Main Navigation"');
  assert(navbarContent.includes('role="search"'), 'Search form has role="search"');
  assert(navbarContent.includes('aria-label="Search products, brands, or categories"'), 'Search input has explicit accessible aria-label');
  assert(navbarContent.includes('aria-label="Clear search input"'), 'Clear search button has accessible aria-label');
  assert(navbarContent.includes('aria-label="Submit Search"'), 'Search button has accessible aria-label');
  assert(navbarContent.includes('aria-label="Category mega menu"'), 'Mega menu trigger button has accessible aria-label');
  assert(navbarContent.includes('aria-label={`Shopping Cart,'), 'Cart button has dynamic accessible aria-label with item count');
  assert(navbarContent.includes('aria-live="polite"'), 'Cart badge counter announces dynamically via aria-live="polite"');

  const bottomNavContent = fs.readFileSync(path.resolve('src/components/BottomNavigation.jsx'), 'utf8');
  assert(bottomNavContent.includes('<nav className="bottom-nav-island" aria-label="Mobile Bottom Navigation">'), 'BottomNavigation uses semantic <nav> landmark');
  assert(bottomNavContent.includes('aria-current='), 'BottomNavigation buttons announce active state with aria-current');

  const footerContent = fs.readFileSync(path.resolve('src/components/Footer.jsx'), 'utf8');
  assert(footerContent.includes('role="contentinfo"'), 'Footer uses semantic role="contentinfo" landmark');

  const clientLayoutContent = fs.readFileSync(path.resolve('src/components/ClientLayout.jsx'), 'utf8');
  assert(clientLayoutContent.includes('<main'), 'ClientLayout wraps content in semantic <main> landmark');

  const toastContent = fs.readFileSync(path.resolve('src/components/Toast.jsx'), 'utf8');
  assert(toastContent.includes('role="alert"'), 'Toast uses role="alert"');
  assert(toastContent.includes('aria-live="assertive"'), 'Toast uses aria-live="assertive" for immediate announcement');
  assert(toastContent.includes('aria-label="Dismiss notification"'), 'Toast dismiss button has accessible aria-label');

  // ---------------------------------------------------------------------------
  // 4. TOUCH TARGET STANDARDS (navbar.css)
  // ---------------------------------------------------------------------------
  console.log('\n--- 4. Mobile 44px Minimum Touch Targets ---');
  const navCssContent = fs.readFileSync(path.resolve('src/assets/styles/navbar.css'), 'utf8');
  assert(navCssContent.includes('min-height: 44px !important'), 'navbar.css enforces min-height: 44px on interactive mobile targets');
  assert(navCssContent.includes('min-width: 44px !important'), 'navbar.css enforces min-width: 44px on mobile buttons');

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
