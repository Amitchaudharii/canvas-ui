# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/topology-controls.spec.js >> Grid Controls UI >> APPLY button triggers topology reload
- Location: tests/e2e/topology-controls.spec.js:34:7

# Error details

```
TimeoutError: page.waitForFunction: Timeout 10000ms exceeded.
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e3]:
      - generic [ref=e4]: GRID
      - generic [ref=e5]:
        - generic [ref=e6]: ROWS
        - generic [ref=e7]:
          - button "−" [ref=e8] [cursor=pointer]
          - spinbutton [ref=e9]: "2"
          - button "+" [ref=e10] [cursor=pointer]
      - generic [ref=e11]: ×
      - generic [ref=e12]:
        - generic [ref=e13]: COLS
        - generic [ref=e14]:
          - button "−" [ref=e15] [cursor=pointer]
          - spinbutton [ref=e16]: "2"
          - button "+" [ref=e17] [cursor=pointer]
      - button "APPLY" [ref=e18] [cursor=pointer]
    - generic [ref=e19]:
      - generic:
        - generic: "ELEMENTS: 94"
        - generic: HOVER OR CLICK TO SELECT
      - generic [ref=e21]:
        - button "+" [ref=e22] [cursor=pointer]
        - button "−" [ref=e23] [cursor=pointer]
        - button "⊡" [ref=e24] [cursor=pointer]
        - button "↺" [ref=e25] [cursor=pointer]
      - generic: "ZOOM: 107%"
      - generic:
        - generic:
          - generic: FROM →
        - generic:
          - generic: ← TO
        - generic:
          - generic: ↔ BOTH
  - button "Open Next.js Dev Tools" [ref=e31] [cursor=pointer]:
    - img [ref=e32]
  - alert [ref=e35]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { navigateAndWait } from '../setup/playwright.setup.js';
  3  | import { getTopologyState } from '../helpers/mouse-simulation.js';
  4  | 
  5  | test.describe('Grid Controls UI', () => {
  6  |   test.beforeEach(async ({ page }) => {
  7  |     await navigateAndWait(page);
  8  |   });
  9  | 
  10 |   test('spinners increment and decrement values', async ({ page }) => {
  11 |     const rowInput = page.locator('input[type="number"]').nth(0);
  12 |     const colInput = page.locator('input[type="number"]').nth(1);
  13 |     
  14 |     // Initial values should be 3
  15 |     await expect(rowInput).toHaveValue('3');
  16 |     await expect(colInput).toHaveValue('3');
  17 | 
  18 |     // Click '+' on rows
  19 |     await page.locator('text="+"').nth(0).click();
  20 |     await expect(rowInput).toHaveValue('4');
  21 | 
  22 |     // Click '-' on cols
  23 |     await page.locator('text="−"').nth(1).click();
  24 |     await expect(colInput).toHaveValue('2');
  25 |   });
  26 | 
  27 |   test('typing values works', async ({ page }) => {
  28 |     const rowInput = page.locator('input[type="number"]').nth(0);
  29 |     
  30 |     await rowInput.fill('10');
  31 |     await expect(rowInput).toHaveValue('10');
  32 |   });
  33 | 
  34 |   test('APPLY button triggers topology reload', async ({ page }) => {
  35 |     const initialState = await getTopologyState(page);
  36 |     
  37 |     // Set grid to 2x2
  38 |     const rowInput = page.locator('input[type="number"]').nth(0);
  39 |     const colInput = page.locator('input[type="number"]').nth(1);
  40 |     await rowInput.fill('2');
  41 |     await colInput.fill('2');
  42 | 
  43 |     // Click APPLY
  44 |     const applyBtn = page.locator('button', { hasText: 'APPLY' });
  45 |     await applyBtn.click();
  46 | 
  47 |     // Verify loading state appears
  48 |     await expect(page.locator('button', { hasText: '···' })).toBeVisible();
  49 | 
  50 |     // Wait for the new grid to load
> 51 |     await page.waitForFunction(() => {
     |                ^ TimeoutError: page.waitForFunction: Timeout 10000ms exceeded.
  52 |       return window.TopologyAPI.registry.size > 0 && window.TopologyAPI.registry.size < 40;
  53 |     });
  54 | 
  55 |     const newState = await getTopologyState(page);
  56 |     // 2x2 grid should have significantly fewer elements than 3x3
  57 |     expect(newState.elementCount).toBeLessThan(initialState.elementCount);
  58 |   });
  59 | 
  60 |   test('Enter key triggers topology reload', async ({ page }) => {
  61 |     const initialState = await getTopologyState(page);
  62 |     
  63 |     // Set grid to 4x4
  64 |     const rowInput = page.locator('input[type="number"]').nth(0);
  65 |     await rowInput.fill('4');
  66 |     await rowInput.press('Enter');
  67 | 
  68 |     // Wait for the new grid to load
  69 |     await page.waitForFunction(() => {
  70 |       return window.TopologyAPI.registry.size > 100; // 4x4 has more elements
  71 |     });
  72 | 
  73 |     const newState = await getTopologyState(page);
  74 |     expect(newState.elementCount).toBeGreaterThan(initialState.elementCount);
  75 |   });
  76 | 
  77 |   test('clamps values to min/max constraints', async ({ page }) => {
  78 |     const rowInput = page.locator('input[type="number"]').nth(0);
  79 |     
  80 |     // Test min (1)
  81 |     await rowInput.fill('0');
  82 |     await page.locator('button', { hasText: 'APPLY' }).click();
  83 |     // After apply, the input might visually stay at 0 until the component rerenders 
  84 |     // or the clamp happens on the apply logic, but the actual fetch uses clamped values.
  85 |     // However, the GridControls component clamps local state onApply too, but it doesn't update the input value.
  86 |     // Instead, let's test the spinner bounds
  87 |     await rowInput.fill('1');
  88 |     await page.locator('text="−"').nth(0).click();
  89 |     await expect(rowInput).toHaveValue('1'); // shouldn't go to 0
  90 | 
  91 |     // Test max (100)
  92 |     await rowInput.fill('100');
  93 |     await page.locator('text="+"').nth(0).click();
  94 |     await expect(rowInput).toHaveValue('100'); // shouldn't go to 101
  95 |   });
  96 | });
  97 | 
```