# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: checkout.spec.js >> Checkout Flow >> should complete end-to-end checkout flow
- Location: tests\checkout.spec.js:7:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('button:has-text("Login")').first()
    - locator resolved to <button class="bottom-nav-item ">…</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is not visible
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is not visible
    - retrying click action
      - waiting 100ms
    33 × waiting for element to be visible, enabled and stable
       - element is not visible
     - retrying click action
       - waiting 500ms

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e3]: 🎉 FREE Shipping on all orders above ₹999 + Extra 20% OFF using code FESTIVE20!
    - banner [ref=e8]:
      - generic [ref=e9]:
        - link "AbKharido.com Direct Buy & Earn" [ref=e11] [cursor=pointer]:
          - /url: "#"
          - generic [ref=e12]: AbKharido.com
          - generic [ref=e13]:
            - text: Direct Buy
            - generic [ref=e14]: "& Earn"
        - generic [ref=e16]:
          - textbox "Search for products, brands and more..." [ref=e17]
          - button "Search by voice" [ref=e18] [cursor=pointer]
          - button [ref=e22] [cursor=pointer]
        - generic [ref=e26]:
          - link "Login" [ref=e27] [cursor=pointer]:
            - /url: "#login"
          - link "Cart" [ref=e28] [cursor=pointer]:
            - /url: "#cart"
    - main [ref=e35]:
      - generic [ref=e36]:
        - generic [ref=e38]:
          - button "🛍️ All Deals" [ref=e39] [cursor=pointer]:
            - generic [ref=e40]: 🛍️
            - generic [ref=e41]: All Deals
          - button "📱 Mobiles" [ref=e42] [cursor=pointer]:
            - generic [ref=e43]: 📱
            - generic [ref=e44]: Mobiles
          - button "🎧 Electronics" [ref=e45] [cursor=pointer]:
            - generic [ref=e46]: 🎧
            - generic [ref=e47]: Electronics
          - button "👗 Fashion" [ref=e48] [cursor=pointer]:
            - generic [ref=e49]: 👗
            - generic [ref=e50]: Fashion
          - button "🏠 Home" [ref=e51] [cursor=pointer]:
            - generic [ref=e52]: 🏠
            - generic [ref=e53]: Home
          - button "💄 Beauty" [ref=e54] [cursor=pointer]:
            - generic [ref=e55]: 💄
            - generic [ref=e56]: Beauty
          - button "🏋️ Sports" [ref=e57] [cursor=pointer]:
            - generic [ref=e58]: 🏋️
            - generic [ref=e59]: Sports
        - generic [ref=e60]:
          - generic [ref=e63]:
            - heading "Titanium AI Sound. Studio Perfected." [level=1] [ref=e64]
            - paragraph [ref=e65]: Experience our flagship spatial noise-cancelling headphones. Up to 60 hours of hyper-battery and quantum acoustics.
            - button "⚡ Claim Deal Now" [ref=e67] [cursor=pointer]
          - generic [ref=e72]:
            - heading "The Platinum Standard in Indian Couture" [level=1] [ref=e73]
            - paragraph [ref=e74]: Elevate your aesthetic with our direct-from-designer runway collection. Uncompromising titanium luxury at revolutionary member prices.
            - button "⚡ Claim Deal Now" [ref=e76] [cursor=pointer]
          - button [ref=e79] [cursor=pointer]
          - button [ref=e82] [cursor=pointer]
        - generic [ref=e85]:
          - generic [ref=e86]: "⚡ VIP Flash Vault: Flat 20% OFF Site-Wide!"
          - generic [ref=e91]:
            - generic [ref=e92]:
              - generic [ref=e93]: "ENDS IN:"
              - generic [ref=e94]: "02"
              - generic [ref=e95]: ":"
              - generic [ref=e96]: "44"
              - generic [ref=e97]: ":"
              - generic [ref=e98]: "41"
            - generic [ref=e99] [cursor=pointer]: "CODE: HURRY20"
        - generic [ref=e102]:
          - generic [ref=e107]:
            - heading "Priority Express Dispatch" [level=4] [ref=e108]
            - paragraph [ref=e109]: Fast 24-48 hr doorstep drop
          - generic [ref=e115]:
            - heading "100% Cashfree Escrow" [level=4] [ref=e116]
            - paragraph [ref=e117]: Bank-grade escrow security
          - generic [ref=e125]:
            - heading "Easy 7-Day Return" [level=4] [ref=e126]
            - paragraph [ref=e127]: Hassle-free replacement policy
          - generic [ref=e133]:
            - heading "Platinum Club Rebates" [level=4] [ref=e134]
            - paragraph [ref=e135]: Earn up to 12% in coins
        - generic [ref=e136]:
          - generic [ref=e137]:
            - generic [ref=e138]:
              - heading "🏛️ Top Brand Partners" [level=3] [ref=e139]:
                - generic [ref=e140]: 🏛️
                - text: Top Brand Partners
              - paragraph [ref=e141]: Direct from licensed brand distributors
            - generic [ref=e142]: ✓ 100% Genuine
          - generic [ref=e143]:
            - generic [ref=e144] [cursor=pointer]:
              - generic [ref=e145]:
                - generic [ref=e146]: 🍏
                - generic [ref=e147]: DIRECT PARTNER
              - generic [ref=e148]:
                - heading "APPLE" [level=4] [ref=e149]
                - paragraph [ref=e150]: Flagship Mac & iPhone
            - generic [ref=e151] [cursor=pointer]:
              - generic [ref=e152]:
                - generic [ref=e153]: 🌌
                - generic [ref=e154]: FLUSH STOCK
              - generic [ref=e155]:
                - heading "SAMSUNG" [level=4] [ref=e156]
                - paragraph [ref=e157]: Galaxy AI & Ultra 5G
            - generic [ref=e158] [cursor=pointer]:
              - generic [ref=e159]:
                - generic [ref=e160]: 🎧
                - generic [ref=e161]: AUDIOPHILE
              - generic [ref=e162]:
                - heading "SONY AUDIO" [level=4] [ref=e163]
                - paragraph [ref=e164]: Noise Cancel & Studio
            - generic [ref=e165] [cursor=pointer]:
              - generic [ref=e166]:
                - generic [ref=e167]: 👟
                - generic [ref=e168]: AUTHORIZED
              - generic [ref=e169]:
                - heading "NIKE SPORT" [level=4] [ref=e170]
                - paragraph [ref=e171]: VaporFly & Air Max
            - generic [ref=e172] [cursor=pointer]:
              - generic [ref=e173]:
                - generic [ref=e174]: 🔊
                - generic [ref=e175]: PREMIUM
              - generic [ref=e176]:
                - heading "BOSE LUXE" [level=4] [ref=e177]
                - paragraph [ref=e178]: Acoustic QuietComfort
            - generic [ref=e179] [cursor=pointer]:
              - generic [ref=e180]:
                - generic [ref=e181]: ⌚
                - generic [ref=e182]: HERITAGE
              - generic [ref=e183]:
                - heading "ROLEX / TAG" [level=4] [ref=e184]
                - paragraph [ref=e185]: Titanium Swiss Couture
        - generic [ref=e187]:
          - generic [ref=e188]:
            - heading "🔥 Trending Picks" [level=3] [ref=e189]:
              - generic [ref=e190]: 🔥
              - text: Trending Picks
            - paragraph [ref=e191]: Top selling across Indian metros right now
          - generic [ref=e192] [cursor=pointer]: View All →
        - generic [ref=e195]:
          - generic [ref=e196]:
            - generic [ref=e197]: 👑 INFLUENCER & CREATOR HUB
            - heading "Monetize Your Digital Influence" [level=3] [ref=e198]
            - paragraph [ref=e199]: Join India's most disruptive Creator Economy. Generate personalized shopping affiliate links, share across WhatsApp/Instagram & earn automated weekly bank payouts up to 12%.
          - button "Launch Creator Console →" [ref=e200] [cursor=pointer]
    - contentinfo [ref=e201]:
      - generic [ref=e203]:
        - generic [ref=e209]:
          - generic [ref=e210]: 100% Cashfree Protected
          - generic [ref=e211]: Bank-grade escrow refund security
        - generic [ref=e216]:
          - generic [ref=e217]: Priority Express Dispatch
          - generic [ref=e218]: Free & fast delivery across India
        - generic [ref=e224]:
          - generic [ref=e225]: Up to 12% Reward Coins
          - generic [ref=e226]: Earn real spendable money on orders
        - generic [ref=e232]:
          - generic [ref=e233]: Easy 7-Day Replacement
          - generic [ref=e234]: Hassle-free verified returns
      - generic [ref=e235]:
        - generic [ref=e236]:
          - generic [ref=e237]:
            - generic [ref=e238]: AbKharido
            - generic [ref=e239]: .com
          - paragraph [ref=e240]: India's premiere ultra-luxury megastore combining genuine direct inventory with an empowered creator affiliate reward ecosystem.
          - generic [ref=e241]:
            - generic [ref=e242]: 1800-888-9999 (Toll Free India)
            - generic [ref=e248]: WhatsApp VIP Support 24/7
            - generic [ref=e252]: support@abkharido.com
        - generic [ref=e257]:
          - heading "VIP Shopping Vaults" [level=4] [ref=e258]
          - generic [ref=e259]:
            - link "AI Smartphones & Flagships" [ref=e260] [cursor=pointer]:
              - /url: "#"
            - link "Audiophile Wireless & Tech" [ref=e263] [cursor=pointer]:
              - /url: "#"
            - link "Luxe Designer Couture" [ref=e266] [cursor=pointer]:
              - /url: "#"
            - link "Smart Home Automation" [ref=e269] [cursor=pointer]:
              - /url: "#"
            - link "Sports & Titanium Watches" [ref=e272] [cursor=pointer]:
              - /url: "#"
            - link "Festive Grand Combo Boxes" [ref=e275] [cursor=pointer]:
              - /url: "#"
        - generic [ref=e278]:
          - heading "Customer Protection" [level=4] [ref=e279]
          - generic [ref=e280]:
            - link "Track Your Order Live" [ref=e281] [cursor=pointer]:
              - /url: "#"
            - link "Easy 7-Day Replacement Guarantee" [ref=e284] [cursor=pointer]:
              - /url: "#"
            - link "Priority Express Shipping Policy" [ref=e287] [cursor=pointer]:
              - /url: "#"
            - link "Cashfree Escrow Refund Protection" [ref=e290] [cursor=pointer]:
              - /url: "#"
            - link "Customer Care Support Helpdesk" [ref=e293] [cursor=pointer]:
              - /url: "#"
        - generic [ref=e296]:
          - heading "Earn With Us" [level=4] [ref=e297]
          - generic [ref=e298]:
            - generic [ref=e299]: 👑 Creator Commission Program
            - paragraph [ref=e300]: Share verified store product links on Instagram/WhatsApp & earn instant 12% cash rewards.
            - button "Launch Creator Portal" [ref=e301] [cursor=pointer]
          - generic [ref=e302]:
            - generic [ref=e303] [cursor=pointer]: 📱 iOS App Store
            - generic [ref=e304] [cursor=pointer]: 🤖 Google Play
      - generic [ref=e306]:
        - generic [ref=e307]: © 2026 AbKharido.com Megastore. All rights reserved. Self-Operated Direct Indian Retailer.
        - generic [ref=e308]:
          - generic [ref=e309]: "SECURE PAYMENTS VIA:"
          - generic [ref=e310]: 🔒 UPI QR
          - generic [ref=e311]: 🔒 RuPay VIP
          - generic [ref=e312]: 🔒 Visa
          - generic [ref=e313]: 🔒 MasterCard
          - generic [ref=e314]: 🔒 NetBanking
          - generic [ref=e315]: 🔒 Cashfree Escrow
    - generic:
      - generic:
        - generic:
          - generic:
            - text: ⚡
            - strong: Neha
            - text: in
            - strong: Chennai
        - generic: Bought TimePiece Classic Minimalist Men's Leather Watch
        - generic: Verified • 4m ago
    - link "Chat live with AbKharido WhatsApp Support!" [ref=e316] [cursor=pointer]:
      - /url: https://pi.whatsapp.com/send?phone=9118001234567&text=Hello%20AbKharido%20Support!%20I%20need%20some%20assistance%20with%20my%20shopping.
  - button "Open Next.js Dev Tools" [ref=e325] [cursor=pointer]
  - alert [ref=e329]
  - generic [ref=e330]:
    - generic [ref=e331]:
      - heading "Your Cart (0)" [level=2] [ref=e332]
      - button [ref=e336] [cursor=pointer]
    - generic [ref=e341]:
      - heading "Your cart is empty" [level=3] [ref=e345]
      - paragraph [ref=e346]: Looks like you haven't added anything to your cart yet.
      - button "Start Shopping" [ref=e347] [cursor=pointer]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Checkout Flow', () => {
  4  |   // We need to login, add an item to cart, and checkout.
  5  |   // Since we don't want to rely on state leaking between tests, we do it all in one test or use test.beforeEach.
  6  | 
  7  |   test('should complete end-to-end checkout flow', async ({ page }) => {
  8  |     // 1. Login
  9  |     await page.goto('/');
> 10 |     await page.locator('button:has-text("Login")').first().click();
     |                                                            ^ Error: locator.click: Test timeout of 30000ms exceeded.
  11 |     await page.locator('input[placeholder="Enter your phone or email"]').fill('9172600587');
  12 |     await page.locator('button:has-text("Continue")').click();
  13 |     
  14 |     const otpInputs = page.locator('.otp-inputs input');
  15 |     await expect(otpInputs.first()).toBeVisible({ timeout: 10000 });
  16 |     const otpStr = '123456';
  17 |     for (let i = 0; i < 6; i++) {
  18 |       await otpInputs.nth(i).fill(otpStr[i]);
  19 |     }
  20 | 
  21 |     const profileIcon = page.locator('.user-avatar, .profile-menu-trigger, svg.lucide-user').first();
  22 |     await expect(profileIcon).toBeVisible({ timeout: 10000 });
  23 | 
  24 |     // 2. Add product to cart
  25 |     await page.goto('/');
  26 |     const productCards = page.locator('.product-card');
  27 |     await expect(productCards.first()).toBeVisible({ timeout: 15000 });
  28 |     await productCards.first().click();
  29 |     
  30 |     const addToCartBtn = page.locator('button:has-text("Add to Cart"), .add-to-cart-btn').first();
  31 |     await expect(addToCartBtn).toBeVisible({ timeout: 10000 });
  32 |     await addToCartBtn.click();
  33 |     await page.waitForTimeout(2000);
  34 | 
  35 |     // 3. Go to checkout
  36 |     await page.goto('/checkout');
  37 |     await page.waitForLoadState('networkidle');
  38 | 
  39 |     // 4. Enter shipping details (if required)
  40 |     // Sometimes the checkout page has address fields, sometimes it's saved.
  41 |     // If there are inputs for address, we fill them:
  42 |     const addressInput = page.locator('input[name="street"], input[placeholder*="Address"]');
  43 |     if (await addressInput.count() > 0) {
  44 |       await addressInput.first().fill('123 Test Street');
  45 |       await page.locator('input[name="city"], input[placeholder*="City"]').first().fill('Test City');
  46 |       await page.locator('input[name="postalCode"], input[placeholder*="PIN"]').first().fill('123456');
  47 |     }
  48 | 
  49 |     // 5. Select Payment Method (e.g. Cashfree)
  50 |     // Wait, the app uses Cashfree which opens a modal or redirects.
  51 |     // We can at least click "Place Order" or "Pay Now"
  52 |     const placeOrderBtn = page.locator('button:has-text("Place Order"), button:has-text("Pay Now")');
  53 |     if (await placeOrderBtn.count() > 0) {
  54 |       // We might not be able to fully automate the 3rd party Cashfree gateway popup without API mocking,
  55 |       // but we can verify the button exists and triggers the intent.
  56 |       await expect(placeOrderBtn.first()).toBeVisible();
  57 |       
  58 |       // In a real robust suite, we would intercept the Cashfree API call and mock the success response.
  59 |       // For now, we just ensure the checkout page renders fully and is interactive.
  60 |     }
  61 |   });
  62 | });
  63 | 
```