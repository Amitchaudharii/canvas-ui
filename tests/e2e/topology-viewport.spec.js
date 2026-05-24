import { test, expect } from '@playwright/test';
import { navigateAndWait } from '../setup/playwright.setup.js';
import { simulateDrag, simulateWheel } from '../helpers/mouse-simulation.js';

test.describe('Topology Viewport', () => {
  test.beforeEach(async ({ page }) => {
    await navigateAndWait(page);
  });

  test('mouse wheel zooms in and out', async ({ page }) => {
    // Zoom in
    await simulateWheel(page, 500, 500, -100);
    let zoomText = await page.locator('text=/^ZOOM: \\d+%/').innerText();
    let zoomPct = parseInt(zoomText.replace(/[^0-9]/g, ''), 10);
    expect(zoomPct).toBeGreaterThan(100);

    // Zoom out
    await simulateWheel(page, 500, 500, 100);
    await simulateWheel(page, 500, 500, 100);
    zoomText = await page.locator('text=/^ZOOM: \\d+%/').innerText();
    zoomPct = parseInt(zoomText.replace(/[^0-9]/g, ''), 10);
    expect(zoomPct).toBeLessThan(100);
  });

  test('drag pans the viewport', async ({ page }) => {
    // Get initial pan state
    const initialPan = await page.evaluate(() => {
      const vp = window.TopologyAPI.engine.viewport;
      return { panX: vp.panX, panY: vp.panY };
    });

    // Drag from (500,500) to (600,400) -> dx=+100, dy=-100
    await simulateDrag(page, { x: 500, y: 500 }, { x: 600, y: 400 });

    const newPan = await page.evaluate(() => {
      const vp = window.TopologyAPI.engine.viewport;
      return { panX: vp.panX, panY: vp.panY };
    });

    expect(newPan.panX).toBeGreaterThan(initialPan.panX);
    expect(newPan.panY).toBeLessThan(initialPan.panY);
  });

  test('zoom UI buttons work', async ({ page }) => {
    // Click '+' button
    await page.locator('button', { hasText: '+' }).click();
    let zoomText = await page.locator('text=/^ZOOM: \\d+%/').innerText();
    let zoomPct = parseInt(zoomText.replace(/[^0-9]/g, ''), 10);
    expect(zoomPct).toBe(120); // 100 * 1.2

    // Click '−' button
    await page.locator('button', { hasText: '−' }).click();
    zoomText = await page.locator('text=/^ZOOM: \\d+%/').innerText();
    zoomPct = parseInt(zoomText.replace(/[^0-9]/g, ''), 10);
    expect(Math.round(zoomPct)).toBe(100); // 120 * 0.83 ~= 100
  });

  test('reset button restores view', async ({ page }) => {
    // Mess up the view
    await page.locator('button', { hasText: '+' }).click();
    await simulateDrag(page, { x: 500, y: 500 }, { x: 800, y: 200 });

    // Click reset '↺'
    await page.locator('button', { hasText: '↺' }).click();

    // Verify reset
    const zoomText = await page.locator('text=/^ZOOM: \\d+%/').innerText();
    expect(zoomText).toBe('ZOOM: 100%');

    const pan = await page.evaluate(() => {
      const vp = window.TopologyAPI.engine.viewport;
      return { panX: vp.panX, panY: vp.panY };
    });
    expect(pan.panX).toBe(0);
    expect(pan.panY).toBe(0);
  });

  test('fit to screen button adjusts zoom to show all elements', async ({ page }) => {
    // Create a scenario where elements are off-screen
    // Generate a huge grid to ensure it overflows the screen initially
    await page.evaluate(() => window.TopologyAPI.setGrid(10, 10));
    
    // Wait for the new large grid to load
    await page.waitForFunction(() => {
      return window.TopologyAPI.registry.size > 100;
    });

    // The default zoom might not fit a 10x10 grid on screen.
    // Click fit '⊡'
    await page.locator('button', { hasText: '⊡' }).click();

    // Zoom should be much smaller than 100% to fit the big grid
    const zoomText = await page.locator('text=/^ZOOM: \\d+%/').innerText();
    const zoomPct = parseInt(zoomText.replace(/[^0-9]/g, ''), 10);
    expect(zoomPct).toBeLessThan(100);
  });
});
