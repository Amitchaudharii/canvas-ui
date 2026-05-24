import { test, expect } from '@playwright/test';
import { navigateAndWait } from '../setup/playwright.setup.js';
import { simulateClick, simulateHover, simulateDrag, simulateWheel, getElementById } from '../helpers/mouse-simulation.js';

test.describe('End-to-End User Flows', () => {
  test.beforeEach(async ({ page }) => {
    await navigateAndWait(page);
  });

  test('Flow 1: Inspect details, clear selection, and hover', async ({ page }) => {
    // Hover a router
    const r = await getElementById(page, 'router-1-1');
    const rScreen = await page.evaluate((pos) => window.TopologyAPI.engine.viewport.toScreen(pos.x, pos.y), { x: r.x, y: r.y });
    await simulateHover(page, rScreen.x, rScreen.y);

    await expect(page.locator('text="ROUTER: router-1-1"')).toBeVisible();

    // Select a bridge
    const bId = await page.evaluate(() => window.TopologyAPI.querySelectorAll('bridge')[0].id);
    const b = await getElementById(page, bId);
    const bScreen = await page.evaluate((pos) => window.TopologyAPI.engine.viewport.toScreen(pos.x, pos.y), { x: b.x, y: b.y });
    await simulateClick(page, bScreen.x, bScreen.y);

    // Verify info panel for bridge
    await expect(page.locator('text="BRIDGE"')).toBeVisible();
    await expect(page.locator(`text="${bId}"`)).toBeVisible();

    // Clear selection
    await page.locator('button[aria-label="Close"]').click();
    await expect(page.locator('text="BRIDGE"')).not.toBeVisible();
  });

  test('Flow 2: Navigation and reset', async ({ page }) => {
    // Zoom in on center
    await simulateWheel(page, 640, 360, -500); // 5 wheel ticks in
    let zoomText = await page.locator('text=/^ZOOM: \\d+%/').innerText();
    expect(parseInt(zoomText.replace(/[^0-9]/g, ''), 10)).toBeGreaterThan(100);

    // Pan viewport heavily
    await simulateDrag(page, { x: 640, y: 360 }, { x: 100, y: 100 }, { steps: 5 });

    // Fit to screen
    await page.locator('button', { hasText: '⊡' }).click();
    
    // Zoom should adjust
    let newZoomText = await page.locator('text=/^ZOOM: \\d+%/').innerText();
    expect(newZoomText).not.toBe(zoomText);

    // Reset view
    await page.locator('button', { hasText: '↺' }).click();
    await expect(page.locator('text="ZOOM: 100%"')).toBeVisible();
  });

  test('Flow 3: Change grid and validate', async ({ page }) => {
    // Change to 5x5
    await page.locator('input[type="number"]').nth(0).fill('5');
    await page.locator('input[type="number"]').nth(1).fill('5');
    await page.locator('button', { hasText: 'APPLY' }).click();

    // Wait for the new grid
    await page.waitForFunction(() => {
      // 5x5 = 25 routers. The old one was 3x3=9.
      return window.TopologyAPI.querySelectorAll('router').length === 25;
    });

    const routerCount = await page.evaluate(() => window.TopologyAPI.querySelectorAll('router').length);
    expect(routerCount).toBe(25);

    // Click fit to screen so we can see all of it
    await page.locator('button', { hasText: '⊡' }).click();

    // Select the last router (router-4-4)
    await page.evaluate(() => window.TopologyAPI.select('router-4-4'));
    await expect(page.locator('text="router-4-4"')).toBeVisible();
  });

  test('Flow 4: Dynamic styling API', async ({ page }) => {
    // Color all routers green
    await page.evaluate(() => {
      window.TopologyAPI.applyStyle('router', { 
        fillColor: '#003300', 
        strokeColor: '#00ff00',
        labelColor: '#00ff00'
      });
      window.TopologyAPI.markDirty();
    });

    // We can't easily assert color from the DOM, but we can verify the state object
    const styles = await page.evaluate(() => {
      return window.TopologyAPI.getElementById('router-0-0').style;
    });

    expect(styles.strokeColor).toBe('#00ff00');
    expect(styles.fillColor).toBe('#003300');

    // Make all bridges invisible
    await page.evaluate(() => {
      window.TopologyAPI.applyState('bridge', { visible: false });
      window.TopologyAPI.markDirty();
    });

    const isVisible = await page.evaluate(() => {
      return window.TopologyAPI.querySelectorAll('bridge')[0].state.visible;
    });

    expect(isVisible).toBe(false);
  });
});
