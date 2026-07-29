const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({headless: 'new'});
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  
  console.log('Navigating to http://localhost:3001 ...');
  await page.goto('http://localhost:3001', {waitUntil: 'networkidle0'});
  
  console.log('Navigation complete. Closing browser.');
  await browser.close();
})();
