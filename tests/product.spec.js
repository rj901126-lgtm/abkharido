import { test, expect } from '@playwright/test';

test.describe('Product Browsing Flow', () => {
  test('should render products on the homepage', async ({ page }) => {
    await page.goto('/');

    // Wait for product cards to render
    const productCards = page.locator('.product-card');
    await expect(productCards.first()).toBeVisible({ timeout: 15000 });
    
    // Check that there is at least one product
    const count = await productCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should navigate to product details page', async ({ page }) => {
    await page.goto('/');

    // Wait for product cards
    const productCards = page.locator('.product-card');
    await expect(productCards.first()).toBeVisible({ timeout: 15000 });

    // Click the first product
    await productCards.first().click();

    // Verify URL changed to /product/:id
    await page.waitForURL(/\/product\/.+/, { timeout: 10000 });

    // Verify Product Details load
    const addToCartBtn = page.locator('button:has-text("Add to Cart"), .add-to-cart-btn').first();
    await expect(addToCartBtn).toBeVisible({ timeout: 10000 });
  });

  test('should search for products', async ({ page }) => {
    await page.goto('/');

    // Locate the search bar
    // It might be an input with placeholder "Search..." or similar
    const searchInput = page.locator('input[type="text"][placeholder*="earch"], input[type="search"]').first();
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    // Type a query
    await searchInput.fill('iPhone');
    await searchInput.press('Enter');

    // It should navigate to search results or filter in place
    // Verify product cards are visible after search
    const productCards = page.locator('.product-card');
    await expect(productCards.first()).toBeVisible({ timeout: 15000 });
  });
});
