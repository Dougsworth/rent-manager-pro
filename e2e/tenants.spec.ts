import { test, expect } from '@playwright/test';

test.describe('Tenants', () => {
  test.skip('add tenant and view in list', async ({ page }) => {
    // This test requires authentication — skip in CI until auth fixtures are set up
    await page.goto('/tenants');
    await page.getByText('Add Tenant').click();
    await expect(page.getByText('Add Tenant')).toBeVisible();

    await page.getByLabel('First Name').fill('E2E');
    await page.getByLabel('Last Name').fill('Tenant');
    await page.getByLabel('Email').fill('e2e@test.com');
    await page.getByLabel('Phone').fill('876-555-0000');
    await page.getByRole('button', { name: /add tenant/i }).click();

    await expect(page.getByText('E2E Tenant')).toBeVisible();
  });
});
