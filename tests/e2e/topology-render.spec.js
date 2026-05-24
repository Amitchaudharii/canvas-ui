import { test, expect } from '@playwright/test';
import { navigateAndWait, getCanvas } from '../setup/playwright.setup.js';
import { isCanvasNonBlank } from '../helpers/screenshot-helpers.js';

test.describe('Topology Rendering', () => {
  test.beforeEach(async ({ page }) => {
    await navigateAndWait(page);
  });

  test('canvas element exists and fills container', async ({ page }) => {
    const canvas = getCanvas(page);
    await expect(canvas).toBeAttached();
    await expect(canvas).toBeVisible();

    const box = await canvas.boundingBox();
    expect(box.width).toBeGreaterThan(0);
    expect(box.height).toBeGreaterThan(0);
  });

  test('HUD renders correct element count', async ({ page }) => {
    // Default mock grid is 3x3.
    // 9 routers, 4-8 bridges each + connections = should be > 50 elements
    const hudPill = page.locator('div', { hasText: /^ELEMENTS:/ });
    await expect(hudPill).toBeVisible();
    
    const text = await hudPill.innerText();
    const count = parseInt(text.replace('ELEMENTS: ', ''), 10);
    expect(count).toBeGreaterThan(50);
  });

  test('ArrowLegend renders 3 direction entries', async ({ page }) => {
    const legend = page.locator('div', { hasText: 'FROM →' }).locator('..');
    await expect(legend).toBeVisible();
    
    await expect(page.locator('text="FROM →"')).toBeVisible();
    await expect(page.locator('text="← TO"')).toBeVisible();
    await expect(page.locator('text="↔ BOTH"')).toBeVisible();
  });

  test('Controls overlay renders 4 zoom buttons and percentage', async ({ page }) => {
    const controls = page.locator('button', { hasText: '+' }).locator('..');
    await expect(controls).toBeVisible();

    await expect(page.locator('button', { hasText: '+' })).toBeVisible();
    await expect(page.locator('button', { hasText: '−' })).toBeVisible();
    await expect(page.locator('button', { hasText: '⊡' })).toBeVisible();
    await expect(page.locator('button', { hasText: '↺' })).toBeVisible();

    const zoomLabel = page.locator('div', { hasText: /^ZOOM:/ });
    await expect(zoomLabel).toBeVisible();
    await expect(zoomLabel).toContainText('%');
  });

  test('canvas is not blank (contains drawing)', async ({ page }) => {
    const nonBlank = await isCanvasNonBlank(page);
    expect(nonBlank).toBe(true);
  });
});
