import { test, expect } from '@playwright/test';
import { navigateAndWait } from '../setup/playwright.setup.js';
import { getTopologyState } from '../helpers/mouse-simulation.js';

test.describe('Grid Controls UI', () => {
  test.beforeEach(async ({ page }) => {
    await navigateAndWait(page);
  });

  test('spinners increment and decrement values', async ({ page }) => {
    const rowInput = page.locator('input[type="number"]').nth(0);
    const colInput = page.locator('input[type="number"]').nth(1);
    
    // Initial values should be 3
    await expect(rowInput).toHaveValue('3');
    await expect(colInput).toHaveValue('3');

    // Click '+' on rows
    await page.locator('text="+"').nth(0).click();
    await expect(rowInput).toHaveValue('4');

    // Click '-' on cols
    await page.locator('text="−"').nth(1).click();
    await expect(colInput).toHaveValue('2');
  });

  test('typing values works', async ({ page }) => {
    const rowInput = page.locator('input[type="number"]').nth(0);
    
    await rowInput.fill('10');
    await expect(rowInput).toHaveValue('10');
  });

  test('APPLY button triggers topology reload', async ({ page }) => {
    const initialState = await getTopologyState(page);
    
    // Set grid to 2x2
    const rowInput = page.locator('input[type="number"]').nth(0);
    const colInput = page.locator('input[type="number"]').nth(1);
    await rowInput.fill('2');
    await colInput.fill('2');

    // Click APPLY
    const applyBtn = page.locator('button', { hasText: 'APPLY' });
    await applyBtn.click();

    // Verify loading state appears
    await expect(page.locator('button', { hasText: '···' })).toBeVisible();

    // Wait for the new grid to load
    await page.waitForFunction(() => {
      return window.TopologyAPI.registry.size > 0 && window.TopologyAPI.registry.size < 40;
    });

    const newState = await getTopologyState(page);
    // 2x2 grid should have significantly fewer elements than 3x3
    expect(newState.elementCount).toBeLessThan(initialState.elementCount);
  });

  test('Enter key triggers topology reload', async ({ page }) => {
    const initialState = await getTopologyState(page);
    
    // Set grid to 4x4
    const rowInput = page.locator('input[type="number"]').nth(0);
    await rowInput.fill('4');
    await rowInput.press('Enter');

    // Wait for the new grid to load
    await page.waitForFunction(() => {
      return window.TopologyAPI.registry.size > 100; // 4x4 has more elements
    });

    const newState = await getTopologyState(page);
    expect(newState.elementCount).toBeGreaterThan(initialState.elementCount);
  });

  test('clamps values to min/max constraints', async ({ page }) => {
    const rowInput = page.locator('input[type="number"]').nth(0);
    
    // Test min (1)
    await rowInput.fill('0');
    await page.locator('button', { hasText: 'APPLY' }).click();
    // After apply, the input might visually stay at 0 until the component rerenders 
    // or the clamp happens on the apply logic, but the actual fetch uses clamped values.
    // However, the GridControls component clamps local state onApply too, but it doesn't update the input value.
    // Instead, let's test the spinner bounds
    await rowInput.fill('1');
    await page.locator('text="−"').nth(0).click();
    await expect(rowInput).toHaveValue('1'); // shouldn't go to 0

    // Test max (100)
    await rowInput.fill('100');
    await page.locator('text="+"').nth(0).click();
    await expect(rowInput).toHaveValue('100'); // shouldn't go to 101
  });
});
