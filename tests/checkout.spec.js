import { test, expect } from '@playwright/test';

const testPhone = process.env.E2E_TEST_PHONE?.trim();
const testOtp = process.env.E2E_TEST_OTP?.trim();

test.describe('Checkout Flow', () => {
  test('should open checkout for a signed-in customer', async ({ page }) => {
    test.skip(!testPhone || !testOtp || testOtp.length !== 6,
      'Set E2E_TEST_PHONE and E2E_TEST_OTP to a Firebase test-number pair to run checkout authentication.');

    await page.goto('/');
    await page.locator('a.login-action-btn').first().click();
    await expect(page.getByRole('heading', { name: 'Sign in or create account' })).toBeVisible();
    await page.locator('input[type="tel"]').fill(testPhone);
    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(page.getByRole('heading', { name: 'Verify with OTP' })).toBeVisible({ timeout: 15000 });
    const otpInputs = page.locator('.auth-otp-grid input');
    await expect(otpInputs).toHaveCount(6);
    for (let i = 0; i < 6; i++) {
      await otpInputs.nth(i).fill(testOtp[i]);
    }
    await page.getByRole('button', { name: /Verify & Continue/i }).click();
    await expect(page.locator('.user-profile-menu-wrap .user-profile-pill').first()).toBeVisible({ timeout: 15000 });

    await page.goto('/');
    const productCards = page.locator('.product-card');
    await expect(productCards.first()).toBeVisible({ timeout: 15000 });
    await productCards.first().click();
    await page.waitForURL(/\\/product\\/.+/, { timeout: 20000 });

    const addToCartBtn = page.getByRole('button', { name: /Add to Bag/i }).first();
    await expect(addToCartBtn).toBeVisible({ timeout: 10000 });
    await addToCartBtn.click();

    await page.goto('/checkout');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/.*checkout/i);
  });
});
