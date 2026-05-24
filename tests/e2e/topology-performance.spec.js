import { test, expect } from '@playwright/test';
import { navigateAndWait } from '../setup/playwright.setup.js';
import { simulateHover } from '../helpers/mouse-simulation.js';

test.describe('Topology Performance', () => {
  test.beforeEach(async ({ page }) => {
    await navigateAndWait(page);
  });

  // Mark these tests with @perf tag so they can be run separately
  test('stress test: rendering 5000+ elements maintains responsive interactions @perf', async ({ page }) => {
    // 15x15 grid with connections will generate ~5000+ elements
    const startLoad = Date.now();
    
    await page.evaluate(() => window.TopologyAPI.setGrid(15, 15));
    
    // Wait for the enormous grid to load
    await page.waitForFunction(() => {
      return window.TopologyAPI.registry.size > 5000;
    }, null, { timeout: 30000 });
    
    const loadTime = Date.now() - startLoad;
    console.log(`[Perf] Loaded 5000+ elements in ${loadTime}ms`);
    
    // Loading should be reasonably fast even for 5000 elements
    expect(loadTime).toBeLessThan(5000); 

    const totalElements = await page.evaluate(() => window.TopologyAPI.registry.size);
    console.log(`[Perf] Total elements: ${totalElements}`);

    // Fit to screen
    await page.locator('button', { hasText: '⊡' }).click();

    // Measure hover latency
    const startHover = Date.now();
    await simulateHover(page, 640, 360);
    const hoverTime = Date.now() - startHover;
    
    console.log(`[Perf] Hover response time: ${hoverTime}ms`);
    // Interaction should remain responsive
    expect(hoverTime).toBeLessThan(100); 
  });

  test('dirty flag optimization prevents redundant renders @perf', async ({ page }) => {
    // Instrument the render loop
    await page.evaluate(() => {
      window._renderCount = 0;
      const originalRender = window.TopologyAPI.engine._render;
      window.TopologyAPI.engine._render = function(ctx, canvas) {
        window._renderCount++;
        return originalRender.call(this, ctx, canvas);
      };
    });

    // Wait a moment
    await page.waitForTimeout(500);
    
    const countAfterIdle = await page.evaluate(() => window._renderCount);
    
    // Wait another moment
    await page.waitForTimeout(500);
    
    const countLater = await page.evaluate(() => window._renderCount);
    
    // Render count should NOT have increased during idle time
    expect(countLater).toBe(countAfterIdle);
    
    // Force a dirty state
    await page.evaluate(() => window.TopologyAPI.markDirty());
    await page.waitForTimeout(100);
    
    const countAfterDirty = await page.evaluate(() => window._renderCount);
    expect(countAfterDirty).toBeGreaterThan(countLater);
  });
});
