import { test, expect } from '@playwright/test';

test.describe('Cart Flow', () => {
  test('should add an item to the cart', async ({ page }) => {
    await page.goto('/');

    const productCards = page.locator('.product-card');
    await expect(productCards.first()).toBeVisible({ timeout: 15000 });
    await productCards.first().click();
    await page.waitForURL(/\/product\/.+/, { timeout: 20000 });

    const addToCartBtn = page.getByRole('button', { name: /Add to Bag/i }).first();
    await expect(addToCartBtn).toBeVisible({ timeout: 10000 });
    await addToCartBtn.click();

    const cartBadge = page.locator('.cart-btn .nav-badge').first();
    await expect(cartBadge).toBeVisible({ timeout: 10000 });
    expect(parseInt((await cartBadge.textContent()).trim(), 10)).toBeGreaterThan(0);
  });

  test('should view the cart page', async ({ page }) => {
    await page.goto('/');
    const productCards = page.locator('.product-card');
    await expect(productCards.first()).toBeVisible({ timeout: 15000 });
    await productCards.first().click();
    await page.waitForURL(/\/product\/.+/, { timeout: 20000 });

    const addToCartBtn = page.getByRole('button', { name: /Add to Bag/i }).first();
    await expect(addToCartBtn).toBeVisible({ timeout: 10000 });
    await addToCartBtn.click();

    await page.goto('/cart');
    await expect(page.getByRole('heading', { name: 'Shopping Bag' })).toBeVisible({ timeout: 10000 });
  });
});
