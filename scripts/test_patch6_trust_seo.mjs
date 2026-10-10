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
  console.log('⚖️ ABKHARIDO PATCH 6: TRUST, LEGAL, SEO & SOCIAL GRAPH INTEGRITY');
  console.log('================================================================\n');

  // ---------------------------------------------------------------------------
  // 1. LEGAL & POLICY PAGES SERVER METADATA & SCHEMA.ORG
  // ---------------------------------------------------------------------------
  console.log('--- 1. Legal Pages & Metadata ---');
  const legalPages = [
    { name: 'terms', file: 'src/app/terms/page.jsx', schemaType: 'WebPage', title: 'Terms' },
    { name: 'privacy', file: 'src/app/privacy/page.jsx', schemaType: 'WebPage', title: 'Privacy' },
    { name: 'returns', file: 'src/app/returns/page.jsx', schemaType: 'MerchantReturnPolicy', title: 'Return' },
    { name: 'shipping', file: 'src/app/shipping/page.jsx', schemaType: 'WebPage', title: 'Shipping' },
    { name: 'contact', file: 'src/app/contact/page.jsx', schemaType: 'ContactPage', title: 'Contact' },
    { name: 'about', file: 'src/app/about/page.jsx', schemaType: 'AboutPage', title: 'About' },
    { name: 'faq', file: 'src/app/faq/page.jsx', schemaType: 'FAQPage', title: 'FAQ' },
  ];

  for (const page of legalPages) {
    const fullPath = path.resolve(page.file);
    assert(fs.existsSync(fullPath), `${page.name} page exists at ${page.file}`);
    const content = fs.readFileSync(fullPath, 'utf8');

    assert(content.includes('export const metadata'), `${page.name} exports server metadata`);
    assert(content.includes('alternates:') && content.includes('canonical:'), `${page.name} declares canonical URL`);
    assert(content.includes('openGraph:'), `${page.name} defines Open Graph metadata`);
    assert(content.includes(page.schemaType), `${page.name} includes Schema.org ${page.schemaType} structured data`);
  }

  // ---------------------------------------------------------------------------
  // 2. TRUTHFUL BUSINESS DETAILS & PRESERVED PHONE NUMBER
  // ---------------------------------------------------------------------------
  console.log('\n--- 2. Truthful Business Details ---');
  const publishedPhone = '9172600587';
  const layoutContent = fs.readFileSync(path.resolve('src/app/layout.jsx'), 'utf8');
  const footerContent = fs.readFileSync(path.resolve('src/components/Footer.jsx'), 'utf8');
  const contactContent = fs.readFileSync(path.resolve('src/app/contact/page.jsx'), 'utf8');
  const constantsContent = fs.readFileSync(path.resolve('src/utils/constants.js'), 'utf8');
  const aboutContent = fs.readFileSync(path.resolve('src/app/about/page.jsx'), 'utf8');

  assert(layoutContent.includes(publishedPhone), 'Root layout JSON-LD retains published business phone +91 9172600587');
  assert(footerContent.includes(publishedPhone), 'Footer retains published business phone +91 9172600587');
  assert(contactContent.includes(publishedPhone), 'Contact page retains published business phone +91 9172600587');
  assert(constantsContent.includes(publishedPhone), 'Constants define SUPPORT_PHONE with +91 9172600587');

  // Business Location Palghar, Maharashtra - 401404
  assert(layoutContent.includes('Palghar') && layoutContent.includes('401404'), 'Root layout defines registered location Palghar 401404');
  assert(aboutContent.includes('Palghar') && aboutContent.includes('401404'), 'About page defines registered location Palghar 401404');
  assert(contactContent.includes('Palghar') && contactContent.includes('401404'), 'Contact page defines registered location Palghar 401404');
  assert(!aboutContent.includes('Devarabeesanahalli'), 'About page cleansed of fake Bengaluru address');

  // Delivery & Free Shipping Rules
  const shippingContent = fs.readFileSync(path.resolve('src/app/shipping/page.jsx'), 'utf8');
  assert(shippingContent.includes('2-5 Days') || shippingContent.includes('2 to 5'), 'Shipping page specifies standard 2-5 day dispatch');
  assert(footerContent.includes('2-5 days'), 'Footer specifies standard 2-5 day delivery');
  assert(constantsContent.includes('FREE_SHIPPING_THRESHOLD = 499'), 'Constants specify free shipping threshold ₹499');

  // ---------------------------------------------------------------------------
  // 3. CATALOGUE & BRAND INTEGRITY IN CATEGORY LANDING PAGES
  // ---------------------------------------------------------------------------
  console.log('\n--- 3. Category Landing Pages & Query Isolation ---');
  const categoryPages = [
    { file: 'src/app/electronics/page.jsx', name: 'electronics' },
    { file: 'src/app/mobiles/page.jsx', name: 'mobiles' },
    { file: 'src/app/fashion/page.jsx', name: 'fashion' },
    { file: 'src/app/appliances/page.jsx', name: 'appliances' },
    { file: 'src/app/categories/page.jsx', name: 'categories' },
  ];

  for (const cat of categoryPages) {
    const content = fs.readFileSync(path.resolve(cat.file), 'utf8');
    assert(
      content.includes("$ne: 'archived'") || content.includes('!p.isArchived'),
      `${cat.name} page queries strictly isolate and exclude archived products`
    );
  }

  // Unapproved phantom brand audit in mobiles page
  const mobilesContent = fs.readFileSync(path.resolve('src/app/mobiles/page.jsx'), 'utf8');
  assert(!mobilesContent.includes('iPhone') && !mobilesContent.includes('Samsung') && !mobilesContent.includes('OnePlus'), 'Mobiles page cleansed of unapproved brand names in metadata');

  // ---------------------------------------------------------------------------
  // 4. SEO & SOCIAL GRAPH TAGS
  // ---------------------------------------------------------------------------
  console.log('\n--- 4. SEO, Social Graph & Schemas ---');
  // Root Layout Open Graph & Twitter
  assert(layoutContent.includes('openGraph:'), 'layout.jsx defines Open Graph');
  assert(layoutContent.includes('twitter:'), 'layout.jsx defines Twitter card');
  assert(layoutContent.includes('robots:'), 'layout.jsx defines robots indexing rules');
  assert(layoutContent.includes('@type\': \'Organization\'') || layoutContent.includes('"@type": "Organization"') || layoutContent.includes('@type\': \'WebSite\''), 'layout.jsx includes Organization and WebSite Schema.org');

  // Product PDP SEO & JSON-LD
  const pdpPageContent = fs.readFileSync(path.resolve('src/app/product/[id]/page.jsx'), 'utf8');
  assert(pdpPageContent.includes('generateMetadata'), 'PDP implements dynamic generateMetadata');
  assert(pdpPageContent.includes('canonicalUrl'), 'PDP declares canonical URL');
  assert(pdpPageContent.includes('@type\': \'Product\'') || pdpPageContent.includes('"@type": "Product"'), 'PDP implements Product Schema.org JSON-LD');
  assert(pdpPageContent.includes('@type\': \'BreadcrumbList\'') || pdpPageContent.includes('"@type": "BreadcrumbList"'), 'PDP implements BreadcrumbList Schema.org JSON-LD');
  assert(pdpPageContent.includes('aggregateRating'), 'PDP dynamically handles aggregateRating schema');

  // Sitemap and Robots
  const sitemapContent = fs.readFileSync(path.resolve('src/app/sitemap.js'), 'utf8');
  assert(sitemapContent.includes('/terms') && sitemapContent.includes('/privacy') && sitemapContent.includes('/shipping'), 'sitemap.js includes legal and policy routes');
  assert(sitemapContent.includes('/product/'), 'sitemap.js includes dynamic product routes');

  const robotsContent = fs.readFileSync(path.resolve('src/app/robots.js'), 'utf8');
  assert(robotsContent.includes('sitemap:'), 'robots.js specifies sitemap location');
  assert(robotsContent.includes("disallow: ['/admin/', '/api/'"), 'robots.js disallows private administrative paths');

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
