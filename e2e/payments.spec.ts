import { test, expect } from '@playwright/test';

test.describe('Payments', () => {
  test.skip('record payment and view in list', async ({ page }) => {
    // Requires authentication
    await page.goto('/payments');
    await page.getByText('Record Payment').click();
    await expect(page.getByText('Amount (JMD)')).toBeVisible();
  });
});
