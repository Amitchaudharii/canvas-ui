import { test, expect } from '@playwright/test';
import { navigateAndWait } from '../setup/playwright.setup.js';
import { simulateHover, simulateClick, getElementById } from '../helpers/mouse-simulation.js';

test.describe('Visual Regression', () => {
  // Use @visual tag so we can run these isolated
  test.beforeEach(async ({ page }) => {
    await navigateAndWait(page);
    
    // For stable screenshots, we need to hide the UI overlays
    // because HUD shows dynamic values like elements count or cursor position
    await page.evaluate(() => {
      document.querySelectorAll('div[style*="fixed"]').forEach(el => {
        el.style.display = 'none';
      });
    });
  });

  test('default topology renders consistently @visual', async ({ page }) => {
    // We already hid the overlays, so just screenshot the canvas
    const canvas = page.locator('canvas');
    await expect(canvas).toHaveScreenshot('topology-default.png');
  });

  test('router hover state @visual', async ({ page }) => {
    // Find router-1-1
    const el = await getElementById(page, 'router-1-1');
    const screen = await page.evaluate((pos) => window.TopologyAPI.engine.viewport.toScreen(pos.x, pos.y), { x: el.x, y: el.y });
    
    await simulateHover(page, screen.x, screen.y);
    
    const canvas = page.locator('canvas');
    await expect(canvas).toHaveScreenshot('topology-router-hover.png');
  });

  test('bridge selection state @visual', async ({ page }) => {
    // Select first bridge
    await page.evaluate(() => {
      const bId = window.TopologyAPI.querySelectorAll('bridge')[0].id;
      window.TopologyAPI.select(bId);
    });

    const canvas = page.locator('canvas');
    await expect(canvas).toHaveScreenshot('topology-bridge-selected.png');
  });

  test('zoomed in view @visual', async ({ page }) => {
    await page.evaluate(() => {
      window.TopologyAPI.engine.viewport.zoomAt(2.0, 640, 360);
      window.TopologyAPI.markDirty();
    });

    // Wait a frame
    await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));

    const canvas = page.locator('canvas');
    await expect(canvas).toHaveScreenshot('topology-zoomed-in.png');
  });
  
  test('custom styled elements via API @visual', async ({ page }) => {
    await page.evaluate(() => {
      // Style all bridges
      window.TopologyAPI.applyStyle('bridge', { 
        fillColor: '#880000', 
        strokeColor: '#ff4444' 
      });
      // Select central router
      window.TopologyAPI.select('router-1-1');
      window.TopologyAPI.markDirty();
    });

    // Wait a frame
    await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));

    const canvas = page.locator('canvas');
    await expect(canvas).toHaveScreenshot('topology-custom-styled.png');
  });
});
