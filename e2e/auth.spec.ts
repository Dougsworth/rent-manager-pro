import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('shows login page by default', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Sign in to your account')).toBeVisible();
  });

  test('navigates to signup page', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Sign up').click();
    await expect(page.getByText('Create your account')).toBeVisible();
  });

  test('shows validation error for invalid email on login', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Email address').fill('notanemail');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText(/invalid email/i)).toBeVisible();
  });

  test('shows validation error for short password on signup', async ({ page }) => {
    await page.goto('/signup');
    await page.getByLabel('First Name').fill('Test');
    await page.getByLabel('Last Name').fill('User');
    await page.getByLabel('Email address').fill('test@example.com');
    await page.getByLabel('Password').fill('123');
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page.getByText(/at least 6 characters/i)).toBeVisible();
  });
});
