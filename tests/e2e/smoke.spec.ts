import { expect, test } from '@playwright/test';

test('plays through direct canvas targets without keyboard controls', async ({ page }) => {
  await page.goto('/');
  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();
  await expect(page.locator('[data-zone]')).toHaveCount(0);

  await page.waitForTimeout(1700);
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas has no bounding box');
  const portrait = box.height > box.width;
  const center = { x: box.width / 2, y: box.height * (portrait ? 0.4 : 0.48) };

  await canvas.click({ position: center });
  await expect(page.locator('[data-readout="phase"]')).toHaveText('JACK UP', { timeout: 1500 });

  await page.waitForTimeout(850);
  await canvas.click({ position: center });
  await expect(page.locator('[data-readout="phase"]')).toHaveText('FIRST SIDE SERVICE', { timeout: 1500 });
});
