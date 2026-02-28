import { test, expect } from '@playwright/test';

test.describe('Invoices', () => {
  test.skip('create invoice and copy payment link', async ({ page }) => {
    // Requires authentication
    await page.goto('/invoices');
    await page.getByText('Create Invoice').click();
    await expect(page.getByText('Amount (JMD)')).toBeVisible();
  });
});
