import fetch from 'node-fetch';

async function testSSR() {
  console.log('--- Testing SSR for / ---');
  const homeRes = await fetch('http://localhost:3000/');
  const homeHtml = await homeRes.text();
  console.log('Home Status:', homeRes.status);
  console.log('Contains iPhone 15 Pro:', homeHtml.includes('Apple iPhone 15 Pro') || homeHtml.includes('iPhone'));
  console.log('Contains Galaxy S24:', homeHtml.includes('Samsung Galaxy S24') || homeHtml.includes('S24'));
  console.log('Contains Schema.org WebSite JSON-LD:', homeHtml.includes('https://schema.org'));

  console.log('\n--- Testing SSR for /catalog ---');
  const catalogRes = await fetch('http://localhost:3000/catalog');
  const catalogHtml = await catalogRes.text();
  console.log('Catalog Status:', catalogRes.status);
  console.log('Contains iPhone in Catalog:', catalogHtml.includes('iPhone'));
  console.log('Contains Shoes in Catalog:', catalogHtml.includes('Shoes') || catalogHtml.includes('Running'));

  console.log('\n--- Testing SSR for /product/iphone-15-pro ---');
  const pdpRes = await fetch('http://localhost:3000/product/iphone-15-pro');
  const pdpHtml = await pdpRes.text();
  console.log('PDP Status:', pdpRes.status);
  console.log('Contains Product Name:', pdpHtml.includes('Apple iPhone 15 Pro'));
  console.log('Contains Schema.org Product JSON-LD:', pdpHtml.includes('Product'));
  console.log('Contains Price 129,990:', pdpHtml.includes('129,990') || pdpHtml.includes('129990'));

  console.log('\n--- Testing SSR 404 for invalid product /product/non-existent-item-999 ---');
  const pdp404Res = await fetch('http://localhost:3000/product/non-existent-item-999');
  console.log('PDP 404 Status:', pdp404Res.status);
}

testSSR().catch(console.error);
