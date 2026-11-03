import { test, expect } from '@playwright/test';

test.describe('Settings', () => {
  test.skip('update profile info', async ({ page }) => {
    // Requires authentication
    await page.goto('/settings');
    await expect(page.getByText('Profile')).toBeVisible();
    await expect(page.getByLabel('First name')).toBeVisible();
  });

  test.skip('update bank details', async ({ page }) => {
    // Requires authentication
    await page.goto('/settings');
    await page.getByText('Bank details').click();
    await expect(page.getByLabel('Bank name')).toBeVisible();
  });
});
