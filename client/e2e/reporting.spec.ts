import { test, expect } from '@playwright/test';

test.describe('Reporting Flow', () => {
  test('User can see the map and explore issues', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.app-container')).toBeVisible();
    await expect(page.locator('.site-brand')).toBeVisible();
  });
});
