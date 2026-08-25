import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const artifactsDir = path.join(__dirname, '..', '..', 'brain', '62f504a8-ace7-4f31-95a6-b3ac9666baaa');

async function captureAdminOMS() {
  console.log('--- CAPTURING MODERN ADMIN OMS DASHBOARD ---');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  
  await context.addInitScript(() => {
    sessionStorage.setItem('abkharido_admin_token', 'admin_jwt_enterprise_mock_2026');
    sessionStorage.setItem('adminToken', 'admin_jwt_enterprise_mock_2026');
    sessionStorage.setItem('adminActiveTab', 'orders');
    localStorage.setItem('adminToken', 'admin_jwt_enterprise_mock_2026');
    localStorage.setItem('abkharido_user_session', JSON.stringify({
      _id: 'admin_64b7f8902',
      id: 'admin_64b7f8902',
      fullName: 'Chief Operations Officer',
      role: 'super_admin',
      isAdmin: true,
      email: 'admin@abkharido.com'
    }));
  });

  const page = await context.newPage();

  await page.route('**/api/orders**', async (route) => {
    const mockOrders = [
      {
        _id: '65e9f821a47291048b012391',
        id: '65e9f821a47291048b012391',
        createdAt: new Date().toISOString(),
        user: { fullName: 'Rohit Sharma', phone: '9820098765', isEmailVerified: true },
        shippingAddress: { fullName: 'Rohit Sharma', phone: '9820098765', address: 'Flat 402, Sea Green Heights, Worli', city: 'Mumbai', state: 'Maharashtra', postalCode: '400018' },
        finalAmount: 14999,
        totalPrice: 14999,
        status: 'Processing',
        paymentMethod: 'Prepaid',
        paymentStatus: 'SUCCESS',
        isPaid: true,
        orderItems: [
          { name: 'Ultra HD 4K Smart Android LED TV 43 Inch', quantity: 1, price: 14999, image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=200' }
        ]
      },
      {
        _id: '65e9f821a47291048b012392',
        id: '65e9f821a47291048b012392',
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
        user: { fullName: 'Priya Patel', phone: '9876543210', isEmailVerified: false },
        shippingAddress: { fullName: 'Priya Patel', phone: '9876543210', address: 'B-12, Navkar Residency, Palghar West', city: 'Palghar', state: 'Maharashtra', postalCode: '401404' },
        finalAmount: 2499,
        totalPrice: 2499,
        status: 'Shipped',
        awbNumber: 'DLV9928371948',
        trackingUrl: 'https://www.delhivery.com/track/package/DLV9928371948',
        paymentMethod: 'Cash on Delivery',
        paymentStatus: 'PENDING',
        isPaid: false,
        orderItems: [
          { name: 'Wireless Noise Cancelling Earbuds Pro', quantity: 1, price: 2499, image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=200' }
        ]
      }
    ];
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockOrders)
    });
  });

  // Go to admin page
  await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle' });
  await page.waitForSelector('text=Orders Control, text=Analytics Control, text=Enterprise Fulfillment Hub', { timeout: 15000 }).catch(() => null);
  await page.waitForTimeout(2000);

  // Click on "All Orders" subnav if visible
  const allOrdersNav = page.locator('div:has-text("All Orders"), span:has-text("All Orders"), button:has-text("All Orders")').first();
  if (await allOrdersNav.count() > 0) {
    await allOrdersNav.click();
    await page.waitForTimeout(2000);
  }

  // Capture Main Orders Hub
  const mainImg = path.join(artifactsDir, 'admin_oms_modernized_view.png');
  await page.screenshot({ path: mainImg, fullPage: false });
  console.log('✓ Saved admin_oms_modernized_view.png');

  // Click Inspect button on first order to capture Inspect Modal
  const inspectBtn = page.locator('button:has-text("Inspect")').first();
  if (await inspectBtn.count() > 0) {
    console.log('Opening Inspect Order modal...');
    await inspectBtn.click();
    await page.waitForTimeout(1500);
    const modalImg = path.join(artifactsDir, 'admin_oms_inspect_modal.png');
    await page.screenshot({ path: modalImg, fullPage: false });
    console.log('✓ Saved admin_oms_inspect_modal.png');
  }

  await browser.close();
  console.log('--- ADMIN OMS CAPTURE COMPLETED SUCCESSFULLY ---');
}

captureAdminOMS().catch(e => console.error(e));

