import { test, expect } from '@playwright/test';
import { navigateAndWait } from '../setup/playwright.setup.js';
import { getTopologyState } from '../helpers/mouse-simulation.js';

test.describe('window.TopologyAPI', () => {
  test.beforeEach(async ({ page }) => {
    await navigateAndWait(page);
  });

  test('API object exists with all methods', async ({ page }) => {
    const apiKeys = await page.evaluate(() => Object.keys(window.TopologyAPI));
    
    const expectedKeys = [
      'getElementById', 'querySelector', 'querySelectorAll',
      'applyStyle', 'applyState', 'select', 'clearSelection',
      'fitToScreen', 'markDirty', 'setGrid', 'reload',
      'engine', 'registry'
    ];

    for (const key of expectedKeys) {
      expect(apiKeys).toContain(key);
    }
  });

  test('query methods return valid data', async ({ page }) => {
    const r1 = await page.evaluate(() => window.TopologyAPI.getElementById('router-0-0').id);
    expect(r1).toBe('router-0-0');

    const bridges = await page.evaluate(() => window.TopologyAPI.querySelectorAll('bridge').map(b => b.id));
    expect(bridges.length).toBeGreaterThan(0);
    expect(bridges[0]).toMatch(/^bridge-/);

    const matchAttr = await page.evaluate(() => window.TopologyAPI.querySelector('[type=router-bridge]').id);
    expect(matchAttr).toMatch(/^conn-bridge-/);
  });

  test('applyStyle updates elements', async ({ page }) => {
    await page.evaluate(() => {
      window.TopologyAPI.applyStyle('router', { strokeColor: '#ff00ff' });
      window.TopologyAPI.markDirty();
    });

    const styles = await page.evaluate(() => {
      const routers = window.TopologyAPI.querySelectorAll('router');
      return routers.map(r => r.style.strokeColor);
    });

    expect(styles[0]).toBe('#ff00ff');
    expect(styles[styles.length - 1]).toBe('#ff00ff');
  });

  test('applyState updates elements', async ({ page }) => {
    await page.evaluate(() => {
      window.TopologyAPI.applyState('bridge', { visible: false });
      window.TopologyAPI.markDirty();
    });

    const states = await page.evaluate(() => {
      const bridges = window.TopologyAPI.querySelectorAll('bridge');
      return bridges.map(b => b.state.visible);
    });

    expect(states[0]).toBe(false);
    expect(states[states.length - 1]).toBe(false);
  });

  test('select and clearSelection work programmatically', async ({ page }) => {
    // Select
    await page.evaluate(() => window.TopologyAPI.select('router-0-0'));
    
    const isSelected = await page.evaluate(() => window.TopologyAPI.getElementById('router-0-0').state.selected);
    expect(isSelected).toBe(true);

    // Verify UI reacts to API call
    await expect(page.locator('text="router-0-0"')).toBeVisible();

    // Clear
    await page.evaluate(() => window.TopologyAPI.clearSelection());
    
    const isCleared = await page.evaluate(() => window.TopologyAPI.getElementById('router-0-0').state.selected);
    expect(isCleared).toBe(false);

    // Verify UI reacts
    await expect(page.locator('text="ROUTER"')).not.toBeVisible();
  });

  test('setGrid reloads new configuration', async ({ page }) => {
    const initialState = await getTopologyState(page);
    
    // Change to 1x1 grid
    await page.evaluate(() => window.TopologyAPI.setGrid(1, 1));
    
    // Wait for reload
    await page.waitForFunction(() => {
      return window.TopologyAPI.registry.size > 0 && window.TopologyAPI.registry.size < 20;
    });

    const newState = await getTopologyState(page);
    expect(newState.elementCount).toBeLessThan(initialState.elementCount);
  });

  test('reload accepts custom configuration', async ({ page }) => {
    const customConfig = {
      routers: [{ id: 'custom-r1', label: 'C1', x: 100, y: 100, radius: 40 }],
      bridges: [],
      connections: []
    };

    await page.evaluate((cfg) => window.TopologyAPI.reload(cfg), customConfig);
    
    // Wait for the specific element to be registered
    await page.waitForFunction(() => !!window.TopologyAPI.getElementById('custom-r1'));

    const state = await getTopologyState(page);
    // 1 router = 1 element total
    expect(state.elementCount).toBe(1);
    
    const uiLabel = await page.locator('text="ELEMENTS: 1"').isVisible();
    expect(uiLabel).toBe(true);
  });
});
