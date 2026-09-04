import { expect, test } from '@playwright/test';

const viewports = [
  { name: 'iPhone SE', width: 375, height: 667, mobile: true },
  { name: 'iPhone 12', width: 390, height: 844, mobile: true },
  { name: 'Pixel 7', width: 412, height: 915, mobile: true },
  { name: 'iPad portrait', width: 768, height: 1024, mobile: false },
];

for (const viewport of viewports) {
  test(`Explore screen fits ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/');

    await expect(page.locator('.app-container')).toBeVisible();
    await expect(page.getByRole('button', { name: 'View Map' })).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
    ).toBe(true);

    if (viewport.mobile) {
      await expect(page.getByRole('button', { name: 'Toggle navigation menu' })).toBeVisible();
      await page.getByRole('button', { name: 'View Map' }).click();
      await expect(page.locator('.leaflet-container')).toBeVisible();
      await expect(page.getByRole('button', { name: 'View List' })).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
      ).toBe(true);
    } else {
      await expect(page.getByRole('link', { name: 'Explore Map' })).toBeVisible();
    }
  });
}
