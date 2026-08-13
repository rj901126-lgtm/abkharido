import { test, expect } from '@playwright/test';

test.describe('Cart Flow', () => {
  // Use a beforeEach hook to go to homepage and add an item if we want,
  // but let's just make the tests self-contained or sequential.
  // Wait, Playwright tests run in parallel by default, so keep them independent.

  test('should add an item to the cart', async ({ page }) => {
    await page.goto('/');

    // Wait for product cards
    const productCards = page.locator('.product-card');
    await expect(productCards.first()).toBeVisible({ timeout: 15000 });

    // Click the first product
    await productCards.first().click();

    // Verify Product Details load
    const addToCartBtn = page.locator('button:has-text("Add to Cart"), .add-to-cart-btn').first();
    await expect(addToCartBtn).toBeVisible({ timeout: 10000 });

    // Click Add to Cart
    await addToCartBtn.click();

    // Verify some toast/notification or state change occurs
    // Often a toast with "Added to cart" appears, or the button text changes
    // Let's just check the cart icon counter
    const cartBadge = page.locator('.cart-count, [data-testid="cart-badge"], .lucide-shopping-cart + span, header .badge').first();
    await expect(cartBadge).toBeVisible({ timeout: 10000 });
    const badgeText = await cartBadge.textContent();
    expect(parseInt(badgeText.trim())).toBeGreaterThan(0);
  });

  test('should view the cart page', async ({ page }) => {
    // Navigate to a product and add to cart to ensure cart isn't empty
    await page.goto('/');
    const productCards = page.locator('.product-card');
    await expect(productCards.first()).toBeVisible({ timeout: 15000 });
    await productCards.first().click();
    
    const addToCartBtn = page.locator('button:has-text("Add to Cart"), .add-to-cart-btn').first();
    await expect(addToCartBtn).toBeVisible({ timeout: 10000 });
    await addToCartBtn.click();
    await page.waitForTimeout(2000); // Wait for cart update

    // Navigate to cart
    await page.goto('/cart');

    // Verify cart page title
    const cartTitle = page.locator('h1:has-text("Cart"), h2:has-text("Shopping Cart")');
    // If there is no specific cart page and it's a drawer, we can look for it
    // Wait, the Next.js app has a /cart route or /checkout route
    const checkoutTitle = page.locator('h1, h2').filter({ hasText: /(Cart|Checkout)/i }).first();
    await expect(checkoutTitle).toBeVisible({ timeout: 10000 });
  });
});
