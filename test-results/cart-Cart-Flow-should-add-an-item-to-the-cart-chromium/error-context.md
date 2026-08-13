# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: cart.spec.js >> Cart Flow >> should add an item to the cart
- Location: tests\cart.spec.js:8:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.product-card').first()
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for locator('.product-card').first()

```

```yaml
- text: 🎉 FREE Shipping on all orders above ₹999 + Extra 20% OFF using code FESTIVE20!
- banner:
  - link "AbKharido.com Direct Buy & Earn":
    - /url: "#"
  - textbox "Search for products, brands and more..."
  - button "Search by voice"
  - button
  - link "Login":
    - /url: "#login"
  - link "Cart":
    - /url: "#cart"
- main:
  - button "🛍️ All Deals"
  - button "📱 Mobiles"
  - button "🎧 Electronics"
  - button "👗 Fashion"
  - button "🏠 Home"
  - button "💄 Beauty"
  - button "🏋️ Sports"
  - heading "Titanium AI Sound. Studio Perfected." [level=1]
  - paragraph: Experience our flagship spatial noise-cancelling headphones. Up to 60 hours of hyper-battery and quantum acoustics.
  - button "⚡ Claim Deal Now"
  - heading "The Platinum Standard in Indian Couture" [level=1]
  - paragraph: Elevate your aesthetic with our direct-from-designer runway collection. Uncompromising titanium luxury at revolutionary member prices.
  - button "⚡ Claim Deal Now"
  - button
  - button
  - text: "⚡ VIP Flash Vault: Flat 20% OFF Site-Wide! ENDS IN: 02 : 44 : 45 CODE: HURRY20"
  - heading "Priority Express Dispatch" [level=4]
  - paragraph: Fast 24-48 hr doorstep drop
  - heading "100% Cashfree Escrow" [level=4]
  - paragraph: Bank-grade escrow security
  - heading "Easy 7-Day Return" [level=4]
  - paragraph: Hassle-free replacement policy
  - heading "Platinum Club Rebates" [level=4]
  - paragraph: Earn up to 12% in coins
  - heading "🏛️ Top Brand Partners" [level=3]
  - paragraph: Direct from licensed brand distributors
  - text: ✓ 100% Genuine 🍏 DIRECT PARTNER
  - heading "APPLE" [level=4]
  - paragraph: Flagship Mac & iPhone
  - text: 🌌 FLUSH STOCK
  - heading "SAMSUNG" [level=4]
  - paragraph: Galaxy AI & Ultra 5G
  - text: 🎧 AUDIOPHILE
  - heading "SONY AUDIO" [level=4]
  - paragraph: Noise Cancel & Studio
  - text: 👟 AUTHORIZED
  - heading "NIKE SPORT" [level=4]
  - paragraph: VaporFly & Air Max
  - text: 🔊 PREMIUM
  - heading "BOSE LUXE" [level=4]
  - paragraph: Acoustic QuietComfort
  - text: ⌚ HERITAGE
  - heading "ROLEX / TAG" [level=4]
  - paragraph: Titanium Swiss Couture
  - heading "🔥 Trending Picks" [level=3]
  - paragraph: Top selling across Indian metros right now
  - text: View All → 👑 INFLUENCER & CREATOR HUB
  - heading "Monetize Your Digital Influence" [level=3]
  - paragraph: Join India's most disruptive Creator Economy. Generate personalized shopping affiliate links, share across WhatsApp/Instagram & earn automated weekly bank payouts up to 12%.
  - button "Launch Creator Console →"
- contentinfo:
  - text: 100% Cashfree Protected Bank-grade escrow refund security Priority Express Dispatch Free & fast delivery across India Up to 12% Reward Coins Earn real spendable money on orders Easy 7-Day Replacement Hassle-free verified returns AbKharido .com
  - paragraph: India's premiere ultra-luxury megastore combining genuine direct inventory with an empowered creator affiliate reward ecosystem.
  - text: 1800-888-9999 (Toll Free India) WhatsApp VIP Support 24/7 support@abkharido.com
  - heading "VIP Shopping Vaults" [level=4]
  - link "AI Smartphones & Flagships":
    - /url: "#"
  - link "Audiophile Wireless & Tech":
    - /url: "#"
  - link "Luxe Designer Couture":
    - /url: "#"
  - link "Smart Home Automation":
    - /url: "#"
  - link "Sports & Titanium Watches":
    - /url: "#"
  - link "Festive Grand Combo Boxes":
    - /url: "#"
  - heading "Customer Protection" [level=4]
  - link "Track Your Order Live":
    - /url: "#"
  - link "Easy 7-Day Replacement Guarantee":
    - /url: "#"
  - link "Priority Express Shipping Policy":
    - /url: "#"
  - link "Cashfree Escrow Refund Protection":
    - /url: "#"
  - link "Customer Care Support Helpdesk":
    - /url: "#"
  - heading "Earn With Us" [level=4]
  - text: 👑 Creator Commission Program
  - paragraph: Share verified store product links on Instagram/WhatsApp & earn instant 12% cash rewards.
  - button "Launch Creator Portal"
  - text: "📱 iOS App Store 🤖 Google Play © 2026 AbKharido.com Megastore. All rights reserved. Self-Operated Direct Indian Retailer. SECURE PAYMENTS VIA: 🔒 UPI QR 🔒 RuPay VIP 🔒 Visa 🔒 MasterCard 🔒 NetBanking 🔒 Cashfree Escrow"
- text: ⚡
- strong: Neha
- text: in
- strong: Jaipur
- text: Bought FlexRun Pro Men Red Sports Running Shoes Verified • 41m ago
- link "Chat live with AbKharido WhatsApp Support!":
  - /url: https://pi.whatsapp.com/send?phone=9118001234567&text=Hello%20AbKharido%20Support!%20I%20need%20some%20assistance%20with%20my%20shopping.
- alert
- heading "Your Cart (0)" [level=2]
- button
- heading "Your cart is empty" [level=3]
- paragraph: Looks like you haven't added anything to your cart yet.
- button "Start Shopping"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Cart Flow', () => {
  4  |   // Use a beforeEach hook to go to homepage and add an item if we want,
  5  |   // but let's just make the tests self-contained or sequential.
  6  |   // Wait, Playwright tests run in parallel by default, so keep them independent.
  7  | 
  8  |   test('should add an item to the cart', async ({ page }) => {
  9  |     await page.goto('/');
  10 | 
  11 |     // Wait for product cards
  12 |     const productCards = page.locator('.product-card');
> 13 |     await expect(productCards.first()).toBeVisible({ timeout: 15000 });
     |                                        ^ Error: expect(locator).toBeVisible() failed
  14 | 
  15 |     // Click the first product
  16 |     await productCards.first().click();
  17 | 
  18 |     // Verify Product Details load
  19 |     const addToCartBtn = page.locator('button:has-text("Add to Cart"), .add-to-cart-btn').first();
  20 |     await expect(addToCartBtn).toBeVisible({ timeout: 10000 });
  21 | 
  22 |     // Click Add to Cart
  23 |     await addToCartBtn.click();
  24 | 
  25 |     // Verify some toast/notification or state change occurs
  26 |     // Often a toast with "Added to cart" appears, or the button text changes
  27 |     // Let's just check the cart icon counter
  28 |     const cartBadge = page.locator('.cart-count, [data-testid="cart-badge"], .lucide-shopping-cart + span, header .badge').first();
  29 |     await expect(cartBadge).toBeVisible({ timeout: 10000 });
  30 |     const badgeText = await cartBadge.textContent();
  31 |     expect(parseInt(badgeText.trim())).toBeGreaterThan(0);
  32 |   });
  33 | 
  34 |   test('should view the cart page', async ({ page }) => {
  35 |     // Navigate to a product and add to cart to ensure cart isn't empty
  36 |     await page.goto('/');
  37 |     const productCards = page.locator('.product-card');
  38 |     await expect(productCards.first()).toBeVisible({ timeout: 15000 });
  39 |     await productCards.first().click();
  40 |     
  41 |     const addToCartBtn = page.locator('button:has-text("Add to Cart"), .add-to-cart-btn').first();
  42 |     await expect(addToCartBtn).toBeVisible({ timeout: 10000 });
  43 |     await addToCartBtn.click();
  44 |     await page.waitForTimeout(2000); // Wait for cart update
  45 | 
  46 |     // Navigate to cart
  47 |     await page.goto('/cart');
  48 | 
  49 |     // Verify cart page title
  50 |     const cartTitle = page.locator('h1:has-text("Cart"), h2:has-text("Shopping Cart")');
  51 |     // If there is no specific cart page and it's a drawer, we can look for it
  52 |     // Wait, the Next.js app has a /cart route or /checkout route
  53 |     const checkoutTitle = page.locator('h1, h2').filter({ hasText: /(Cart|Checkout)/i }).first();
  54 |     await expect(checkoutTitle).toBeVisible({ timeout: 10000 });
  55 |   });
  56 | });
  57 | 
```