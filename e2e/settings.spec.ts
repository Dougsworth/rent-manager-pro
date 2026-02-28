import { test, expect } from '@playwright/test';

test.describe('Settings', () => {
  test.skip('update profile info', async ({ page }) => {
    // Requires authentication
    await page.goto('/settings');
    await expect(page.getByText('Profile')).toBeVisible();
    await expect(page.getByLabel('First Name')).toBeVisible();
  });

  test.skip('update bank details', async ({ page }) => {
    // Requires authentication
    await page.goto('/settings');
    await page.getByText('Bank Details').click();
    await expect(page.getByLabel('Bank Name')).toBeVisible();
  });
});
