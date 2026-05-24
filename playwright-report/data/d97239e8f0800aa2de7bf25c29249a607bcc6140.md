# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/topology-render.spec.js >> Topology Rendering >> Controls overlay renders 4 zoom buttons and percentage
- Location: tests/e2e/topology-render.spec.js:40:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('button').filter({ hasText: '+' }).locator('..')
Expected: visible
Error: strict mode violation: locator('button').filter({ hasText: '+' }).locator('..') resolved to 3 elements:
    1) <div>…</div> aka getByText('−+').first()
    2) <div>…</div> aka getByText('−+').nth(1)
    3) <div>…</div> aka getByText('+−⊡↺')

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('button').filter({ hasText: '+' }).locator('..')

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
          - spinbutton [ref=e9]: "3"
          - button "+" [ref=e10] [cursor=pointer]
      - generic [ref=e11]: ×
      - generic [ref=e12]:
        - generic [ref=e13]: COLS
        - generic [ref=e14]:
          - button "−" [ref=e15] [cursor=pointer]
          - spinbutton [ref=e16]: "3"
          - button "+" [ref=e17] [cursor=pointer]
      - button "APPLY" [ref=e18] [cursor=pointer]
    - generic [ref=e19]:
      - generic:
        - generic: "ELEMENTS: 227"
        - generic: HOVER OR CLICK TO SELECT
      - generic [ref=e21]:
        - button "+" [ref=e22] [cursor=pointer]
        - button "−" [ref=e23] [cursor=pointer]
        - button "⊡" [ref=e24] [cursor=pointer]
        - button "↺" [ref=e25] [cursor=pointer]
      - generic: "ZOOM: 74%"
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
  2  | import { navigateAndWait, getCanvas } from '../setup/playwright.setup.js';
  3  | import { isCanvasNonBlank } from '../helpers/screenshot-helpers.js';
  4  | 
  5  | test.describe('Topology Rendering', () => {
  6  |   test.beforeEach(async ({ page }) => {
  7  |     await navigateAndWait(page);
  8  |   });
  9  | 
  10 |   test('canvas element exists and fills container', async ({ page }) => {
  11 |     const canvas = getCanvas(page);
  12 |     await expect(canvas).toBeAttached();
  13 |     await expect(canvas).toBeVisible();
  14 | 
  15 |     const box = await canvas.boundingBox();
  16 |     expect(box.width).toBeGreaterThan(0);
  17 |     expect(box.height).toBeGreaterThan(0);
  18 |   });
  19 | 
  20 |   test('HUD renders correct element count', async ({ page }) => {
  21 |     // Default mock grid is 3x3.
  22 |     // 9 routers, 4-8 bridges each + connections = should be > 50 elements
  23 |     const hudPill = page.locator('div', { hasText: /^ELEMENTS:/ });
  24 |     await expect(hudPill).toBeVisible();
  25 |     
  26 |     const text = await hudPill.innerText();
  27 |     const count = parseInt(text.replace('ELEMENTS: ', ''), 10);
  28 |     expect(count).toBeGreaterThan(50);
  29 |   });
  30 | 
  31 |   test('ArrowLegend renders 3 direction entries', async ({ page }) => {
  32 |     const legend = page.locator('div', { hasText: 'FROM →' }).locator('..');
  33 |     await expect(legend).toBeVisible();
  34 |     
  35 |     await expect(page.locator('text="FROM →"')).toBeVisible();
  36 |     await expect(page.locator('text="← TO"')).toBeVisible();
  37 |     await expect(page.locator('text="↔ BOTH"')).toBeVisible();
  38 |   });
  39 | 
  40 |   test('Controls overlay renders 4 zoom buttons and percentage', async ({ page }) => {
  41 |     const controls = page.locator('button', { hasText: '+' }).locator('..');
> 42 |     await expect(controls).toBeVisible();
     |                            ^ Error: expect(locator).toBeVisible() failed
  43 | 
  44 |     await expect(page.locator('button', { hasText: '+' })).toBeVisible();
  45 |     await expect(page.locator('button', { hasText: '−' })).toBeVisible();
  46 |     await expect(page.locator('button', { hasText: '⊡' })).toBeVisible();
  47 |     await expect(page.locator('button', { hasText: '↺' })).toBeVisible();
  48 | 
  49 |     const zoomLabel = page.locator('div', { hasText: /^ZOOM:/ });
  50 |     await expect(zoomLabel).toBeVisible();
  51 |     await expect(zoomLabel).toContainText('%');
  52 |   });
  53 | 
  54 |   test('canvas is not blank (contains drawing)', async ({ page }) => {
  55 |     const nonBlank = await isCanvasNonBlank(page);
  56 |     expect(nonBlank).toBe(true);
  57 |   });
  58 | });
  59 | 
```