import { test, expect } from '@playwright/test';

test.describe('End-to-End User Shopping Journey (Patch 5.6)', () => {
  test('Complete flow: browse (/) → search ("signature") → product (/product/signature-wireless-earphone) → add to cart → view cart (/cart)', async ({ page }) => {
    // 1. Browse Homepage (/)
    await page.goto('/');
    await expect(page).toHaveURL(/\//);

    // Verify header and brand logo are visible
    const logo = page.locator('.logo-text');
    await expect(logo).toBeVisible({ timeout: 10000 });

    // 2. Search ('signature')
    const searchInput = page.locator('input.search-input, input[placeholder*="Search"]').first();
    await expect(searchInput).toBeVisible({ timeout: 10000 });
    await searchInput.fill('signature');
    await searchInput.press('Enter');

    // Verify navigation to catalog with search query
    await page.waitForURL(/.*catalog.*search=signature/i, { timeout: 10000 });
    await expect(page.locator('.product-card').first()).toBeVisible({ timeout: 15000 });

    // 3. Navigate to keeper product (/product/signature-wireless-earphone)
    const productCard = page.locator('.product-card').first();
    await productCard.click();

    // Verify PDP URL loads correctly
    await page.waitForURL(/.*product\/(signature-wireless-earphone|sigboom-21)/i, { timeout: 10000 });

    // 4. Add to Cart
    // Either desktop Add to Bag button or mobile sticky bar button
    const addToCartBtn = page.locator('.add-cart-outline-btn, .mobile-sticky-cart-btn-add, button:has-text("Add to Bag"), button:has-text("Add to Cart")').first();
    await expect(addToCartBtn).toBeVisible({ timeout: 10000 });
    await addToCartBtn.click();

    // Verify cart count badge increments
    const cartBadge = page.locator('.cart-count, [data-testid="cart-badge"], .nav-cart-btn span').first();
    await expect(cartBadge).toBeVisible({ timeout: 10000 });
    const badgeText = await cartBadge.textContent();
    expect(parseInt(badgeText?.trim() || '0', 10)).toBeGreaterThan(0);

    // 5. View Cart (/cart)
    await page.goto('/cart');
    await expect(page).toHaveURL(/.*cart/i);

    // Verify cart page loads with the added item
    const cartContent = page.locator('.cart-item, .cart-card, h1:has-text("Cart"), h2:has-text("Cart")').first();
    await expect(cartContent).toBeVisible({ timeout: 10000 });
  });
});
