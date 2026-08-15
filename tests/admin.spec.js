import { test, expect } from '@playwright/test';

test.describe('Admin Flow', () => {
  test('should login as admin and verify dashboard components', async ({ page }) => {
    await page.goto('http://localhost:3000/admin');
    
    // 1. Admin Login
    const pinInput = page.locator('input[type="password"]').first();
    await pinInput.fill('2026'); // Valid PIN from the .env or fallback
    await page.locator('button:has-text("UNLOCK INVENTORY CONTROL")').click();
    
    // 2. Wait for dashboard to load
    await expect(page.locator('text=Analytics Control')).toBeVisible({ timeout: 15000 });
    
    // 3. Navigate through the tabs to verify they don't crash
    const tabs = [
      'Dashboard',
      'Inventory',
      'Add Product',
      'CMS & Layout',
      'Banners',
      'Orders',
      'Helpdesk',
      'Users',
      'Marketing'
    ];
    
    for (const tab of tabs) {
      await page.locator(`span:has-text("${tab}")`).first().click({ force: true });
      await page.waitForTimeout(500);
      // Verify no Error Boundary message is present
      const errorBoundary = page.locator('text=AbKharido Global Error Boundary Caught');
      await expect(errorBoundary).toHaveCount(0);
    }
    
    // 4. Test Product Studio (Add Product)
    await page.locator('span:has-text("Add Product")').first().click({ force: true });
    
    const nameInput = page.locator('input[placeholder="e.g. iPhone 15 Pro Max"]');
    await nameInput.waitFor({ state: 'visible' });
    await nameInput.fill('Test Product E2E');
    
    const priceInput = page.locator('input[placeholder="e.g. 159900"]');
    await priceInput.fill('999');
    
    await page.locator('button:has-text("Save & Publish")').first().click();
    await expect(page.locator('text=Test Product E2E has been created')).toBeVisible();
  });
});
