import { test, expect } from '@playwright/test';

const testPhone = process.env.E2E_TEST_PHONE?.trim();
const testOtp = process.env.E2E_TEST_OTP?.trim();

async function completeLogin(page) {
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

  const profile = page.locator('.user-profile-menu-wrap .user-profile-pill').first();
  await expect(profile).toBeVisible({ timeout: 15000 });
  return profile;
}

test.describe('Authentication Flow', () => {
  test('shows the current phone sign-in form', async ({ page }) => {
    await page.goto('/');
    await page.locator('a.login-action-btn').first().click();

    await expect(page.getByRole('heading', { name: 'Sign in or create account' })).toBeVisible();
    const phoneInput = page.locator('input[type="tel"]');
    await expect(phoneInput).toBeVisible();
    await phoneInput.fill('9172600587');
    await expect(page.getByRole('button', { name: 'Continue' })).toBeEnabled();
  });

  test('logs in with a configured test OTP', async ({ page }) => {
    test.skip(!testPhone || !testOtp || testOtp.length !== 6,
      'Set E2E_TEST_PHONE and E2E_TEST_OTP to a Firebase test-number pair to run live OTP checks.');
    await completeLogin(page);
  });

  test('logs out successfully with a configured test OTP', async ({ page }) => {
    test.skip(!testPhone || !testOtp || testOtp.length !== 6,
      'Set E2E_TEST_PHONE and E2E_TEST_OTP to a Firebase test-number pair to run live OTP checks.');
    const profile = await completeLogin(page);

    await profile.click();
    await page.getByRole('button', { name: 'Logout Account' }).click();
    await expect(page.locator('a.login-action-btn').first()).toBeVisible({ timeout: 15000 });
  });
});
