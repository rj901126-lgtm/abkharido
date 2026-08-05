const fs = require('fs');

let content = fs.readFileSync('src/views/ProductDetails.jsx', 'utf8');

// Add imports
if (!content.includes('import ProductReviews')) {
  content = content.replace(
    `import { useRouter } from 'next/navigation';`,
    `import { useRouter } from 'next/navigation';\nimport ProductReviews from '../components/ProductReviews';\nimport FrequentlyBoughtTogether from '../components/FrequentlyBoughtTogether';`
  );
}

// Inject components before the fixed bottom bar
const targetDiv = `{/* dYs? GLOBAL FIXED VIP ENTERPRISE PURCHASE RIBBON (STICKY BUY BAR FOR INSTANT 1-CLICK BUY) */}`;

if (content.includes(targetDiv) && !content.includes('<FrequentlyBoughtTogether')) {
  content = content.replace(
    targetDiv,
    `<FrequentlyBoughtTogether category={product.category} currentProductId={product._id} />\n          <ProductReviews product={product} productId={product._id} />\n\n          ${targetDiv}`
  );
}

fs.writeFileSync('src/views/ProductDetails.jsx', content, 'utf8');
console.log('ProductDetails.jsx updated successfully.');
