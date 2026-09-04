import { test, expect } from '@playwright/test';

test.describe('Reporting Flow', () => {
  test('User can see the map and explore issues', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.app-container')).toBeVisible();
    await expect(page.locator('.site-brand')).toBeVisible();
  });

  test('Demo citizen can sign in and open the report wizard', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.getByRole('button', { name: 'Demo Citizen' }).click();

    await expect(page.getByRole('link', { name: 'My Reports' })).toBeVisible();
    await page.getByRole('link', { name: 'New Report' }).first().click();
    await expect(
      page.getByRole('heading', { name: 'Report a Community Issue' })
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible();
  });

  test('Arabic report flow uses RTL on a mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Toggle navigation menu' }).click();
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.getByRole('button', { name: 'Demo Citizen' }).click();
    await page.getByRole('button', { name: 'Change language' }).click();
    await page.getByRole('button', { name: 'العربية' }).click();
    await page.getByRole('link', { name: 'تقديم بلاغ' }).first().click();

    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.getByRole('heading', { name: 'تقديم بلاغ عن مشكلة مجتمعية' })).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
    ).toBe(true);
  });
});
