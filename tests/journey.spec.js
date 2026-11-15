import { test, expect } from '@playwright/test';

test.describe('End-to-End User Shopping Journey', () => {
  test('browse, search, open a product, add it to cart, and view the cart', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/$/);

    const logo = page.locator('a.logo-container[aria-label="AbKharido Home"]');
    await expect(logo).toBeVisible({ timeout: 10000 });

    const searchInput = page.getByRole('textbox', { name: 'Search products, brands, or categories' });
    await expect(searchInput).toBeVisible({ timeout: 10000 });
    await searchInput.fill('signature');
    await expect(searchInput).toHaveValue('signature');
    await page.getByRole('button', { name: 'Submit Search' }).click();

    await page.waitForURL(/.*catalog.*search=signature/i, { timeout: 10000 });
    await expect(page.locator('.product-card').first()).toBeVisible({ timeout: 15000 });

    await page.locator('.product-card').first().click();
    await page.waitForURL(/.*product\/(signature-wireless-earphone|sigboom-21)/i, { timeout: 10000 });

    const addToCartBtn = page.getByRole('button', { name: /Add to Bag/i }).first();
    await expect(addToCartBtn).toBeVisible({ timeout: 10000 });
    await addToCartBtn.click();

    const cartBadge = page.locator('.cart-btn .nav-badge').first();
    await expect(cartBadge).toBeVisible({ timeout: 10000 });
    expect(parseInt((await cartBadge.textContent())?.trim() || '0', 10)).toBeGreaterThan(0);

    await page.goto('/cart');
    await expect(page).toHaveURL(/.*cart/i);
    await expect(page.getByRole('heading', { name: 'Shopping Bag' })).toBeVisible({ timeout: 10000 });
  });
});
