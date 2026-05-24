import { test, expect } from '@playwright/test';
import { navigateAndWait, getCanvas } from '../setup/playwright.setup.js';
import { simulateClick, simulateHover, getElementById, queryElements } from '../helpers/mouse-simulation.js';

test.describe('Topology Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await navigateAndWait(page);
  });

  test('hovering an element updates the HUD', async ({ page }) => {
    // Find a router's world position from the API
    const el = await getElementById(page, 'router-1-1'); // center router in 3x3
    expect(el).not.toBeNull();

    // Convert world to screen via API
    const screen = await page.evaluate((pos) => {
      return window.TopologyAPI.engine.viewport.toScreen(pos.x, pos.y);
    }, { x: el.x, y: el.y });

    // Hover that screen position
    await simulateHover(page, screen.x, screen.y);

    // Verify HUD updates
    const hudHighlight = page.locator('div', { hasText: /^ROUTER: router-1-1$/ });
    await expect(hudHighlight).toBeVisible();

    // Cursor should be pointer
    const canvas = getCanvas(page);
    await expect(canvas).toHaveCSS('cursor', 'pointer');
  });

  test('clicking empty space clears selection', async ({ page }) => {
    // First select something programmatically
    await page.evaluate(() => window.TopologyAPI.select('router-0-0'));
    
    // Verify InfoPanel is open
    await expect(page.locator('text="router-0-0"')).toBeVisible();

    // Click near top-left corner (0,0 is usually empty in the grid)
    await simulateClick(page, 10, 10);

    // InfoPanel should disappear
    await expect(page.locator('text="router-0-0"')).not.toBeVisible();
  });

  test('clicking a router opens InfoPanel', async ({ page }) => {
    const el = await getElementById(page, 'router-0-0');
    const screen = await page.evaluate((pos) => {
      return window.TopologyAPI.engine.viewport.toScreen(pos.x, pos.y);
    }, { x: el.x, y: el.y });

    await simulateClick(page, screen.x, screen.y);

    // InfoPanel appears with router properties
    await expect(page.locator('text="ROUTER"')).toBeVisible();
    await expect(page.locator('text="router-0-0"')).toBeVisible();
    await expect(page.locator('text="radius"')).toBeVisible();
  });

  test('clicking a bridge opens InfoPanel', async ({ page }) => {
    // Query all bridges to find one to click
    const bridges = await queryElements(page, 'bridge');
    const targetId = bridges[0].id;
    
    const el = await getElementById(page, targetId);
    const screen = await page.evaluate((pos) => {
      return window.TopologyAPI.engine.viewport.toScreen(pos.x, pos.y);
    }, { x: el.x, y: el.y });

    await simulateClick(page, screen.x, screen.y);

    await expect(page.locator('text="BRIDGE"')).toBeVisible();
    await expect(page.locator(`text="${targetId}"`)).toBeVisible();
    await expect(page.locator('text="routerId"')).toBeVisible();
  });

  test('clicking a connection line opens InfoPanel', async ({ page }) => {
    // Connection lines have an offset, so we click the middle of the offset line
    const lines = await queryElements(page, 'connection-line');
    const targetId = lines[0].id;
    
    // Have the browser evaluate the exact hit point on the screen
    const screen = await page.evaluate((id) => {
      const line = window.TopologyAPI.getElementById(id);
      const from = window.TopologyAPI.getElementById(line.fromId);
      const to = window.TopologyAPI.getElementById(line.toId);
      
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const len = Math.sqrt(dx*dx + dy*dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;
      
      // Middle of the line, adjusted by perpendicular offset
      const mx = (from.x + to.x) / 2 + nx * line.offset;
      const my = (from.y + to.y) / 2 + ny * line.offset;
      
      return window.TopologyAPI.engine.viewport.toScreen(mx, my);
    }, targetId);

    await simulateClick(page, screen.x, screen.y);

    await expect(page.locator('text="CONNECTION-LINE"')).toBeVisible();
    await expect(page.locator(`text="${targetId}"`)).toBeVisible();
    await expect(page.locator('text="lineIndex"')).toBeVisible();
    await expect(page.locator('text="offset"')).toBeVisible();
  });

  test('InfoPanel close button clears selection', async ({ page }) => {
    await page.evaluate(() => window.TopologyAPI.select('router-0-0'));
    await expect(page.locator('text="ROUTER"')).toBeVisible();

    // Click the X button (which is the only button in the InfoPanel header)
    await page.locator('button[aria-label="Close"]').click();

    await expect(page.locator('text="ROUTER"')).not.toBeVisible();
  });
});
