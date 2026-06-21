import { expect, test } from '@playwright/test';

test('loads playable PIT//PERFECT shell', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-zone="left"]')).toBeVisible();
  await expect(page.locator('[data-zone="right"]')).toBeVisible();
  await page.keyboard.press('Space');
  await page.keyboard.press('F');
  await page.keyboard.press('J');
  await expect(page.locator('canvas')).toBeVisible();
});
