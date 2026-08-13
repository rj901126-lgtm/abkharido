import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should login with OTP using developer test number', async ({ page }) => {
    // Navigate to home page and open login modal
    await page.goto('/');
    
    const loginButton = page.locator('button:has-text("Login")').first();
    await loginButton.click();

    // Verify modal is visible
    const modalTitle = page.locator('h3:has-text("Login or Sign up")');
    await expect(modalTitle).toBeVisible();

    // Enter phone number
    const phoneInput = page.locator('input[placeholder="Enter your phone or email"]');
    await phoneInput.fill('9172600587');

    // Click Continue
    const continueBtn = page.locator('button:has-text("Continue")');
    await continueBtn.click();

    // Wait for OTP step
    const otpText = page.locator('text=Enter OTP');
    await expect(otpText).toBeVisible({ timeout: 10000 });

    // Assuming there are 6 OTP inputs
    const otpInputs = page.locator('.otp-inputs input');
    await expect(otpInputs).toHaveCount(6);

    // Fill the test OTP '123456'
    await otpInputs.nth(0).fill('1');
    await otpInputs.nth(1).fill('2');
    await otpInputs.nth(2).fill('3');
    await otpInputs.nth(3).fill('4');
    await otpInputs.nth(4).fill('5');
    await otpInputs.nth(5).fill('6');

    // Verify successful login by checking if user avatar/profile appears
    // The modal should close and the login button should be replaced by a user profile icon
    await expect(page.locator('button:has-text("Login")')).toHaveCount(0, { timeout: 10000 });
    
    // Check if toast message says Welcome or similar (optional, might disappear quickly)
    // We can also check if a user avatar or "My Account" is visible
    const profileIcon = page.locator('.user-avatar, .profile-menu-trigger, svg.lucide-user').first();
    await expect(profileIcon).toBeVisible({ timeout: 10000 });
  });

  test('should logout successfully', async ({ page }) => {
    // First, login
    await page.goto('/');
    await page.locator('button:has-text("Login")').first().click();
    await page.locator('input[placeholder="Enter your phone or email"]').fill('9172600587');
    await page.locator('button:has-text("Continue")').click();
    
    const otpInputs = page.locator('.otp-inputs input');
    await expect(otpInputs.first()).toBeVisible({ timeout: 10000 });
    const otpStr = '123456';
    for (let i = 0; i < 6; i++) {
      await otpInputs.nth(i).fill(otpStr[i]);
    }

    // Wait for login to complete
    const profileIcon = page.locator('.user-avatar, .profile-menu-trigger, svg.lucide-user').first();
    await expect(profileIcon).toBeVisible({ timeout: 10000 });

    // Open profile menu
    await profileIcon.click();

    // Click Logout
    const logoutBtn = page.locator('button:has-text("Logout"), a:has-text("Logout"), text=Logout');
    await logoutBtn.click();

    // Wait for the login button to reappear
    const loginButton = page.locator('button:has-text("Login")').first();
    await expect(loginButton).toBeVisible({ timeout: 10000 });
  });
});
