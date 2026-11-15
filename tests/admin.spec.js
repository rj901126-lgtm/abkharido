import { test, expect } from '@playwright/test';

test.describe('Admin Flow', () => {
  test('should unlock the admin dashboard and open Product Studio', async ({ page }) => {
    const adminPin = process.env.ADMIN_SECURE_PIN?.trim();
    test.skip(!adminPin, 'ADMIN_SECURE_PIN must be set in the test environment to exercise this flow.');

    await page.goto('/admin');

    const pinInput = page.locator('input[type="password"]').first();
    await pinInput.fill(adminPin);
    await page.getByRole('button', { name: 'UNLOCK CONTROL CENTER' }).click();

    await expect(page.getByText('Analytics Control', { exact: true })).toBeVisible({ timeout: 15000 });

    const inventoryNav = page.locator('.admin-nav-item').filter({ hasText: 'Products & Inventory' }).first();
    await inventoryNav.click();
    await expect(page.getByText('Live Inventory & PIM Engine 2.0', { exact: true })).toBeVisible({ timeout: 15000 });

    await page.getByRole('button', { name: 'Add Product' }).click();
    await expect(page.getByRole('heading', { name: 'Create & Elevate Storefront Products' })).toBeVisible({ timeout: 10000 });
  });
});
