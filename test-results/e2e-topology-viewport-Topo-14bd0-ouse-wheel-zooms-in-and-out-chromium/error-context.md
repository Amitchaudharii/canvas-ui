# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/topology-viewport.spec.js >> Topology Viewport >> mouse wheel zooms in and out
- Location: tests/e2e/topology-viewport.spec.js:10:7

# Error details

```
Error: expect(received).toBeGreaterThan(expected)

Expected: > 100
Received:   81
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
      - generic: "ZOOM: 81%"
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
  3  | import { simulateDrag, simulateWheel } from '../helpers/mouse-simulation.js';
  4  | 
  5  | test.describe('Topology Viewport', () => {
  6  |   test.beforeEach(async ({ page }) => {
  7  |     await navigateAndWait(page);
  8  |   });
  9  | 
  10 |   test('mouse wheel zooms in and out', async ({ page }) => {
  11 |     // Zoom in
  12 |     await simulateWheel(page, 500, 500, -100);
  13 |     let zoomText = await page.locator('text=/^ZOOM: \\d+%/').innerText();
  14 |     let zoomPct = parseInt(zoomText.replace(/[^0-9]/g, ''), 10);
> 15 |     expect(zoomPct).toBeGreaterThan(100);
     |                     ^ Error: expect(received).toBeGreaterThan(expected)
  16 | 
  17 |     // Zoom out
  18 |     await simulateWheel(page, 500, 500, 100);
  19 |     await simulateWheel(page, 500, 500, 100);
  20 |     zoomText = await page.locator('text=/^ZOOM: \\d+%/').innerText();
  21 |     zoomPct = parseInt(zoomText.replace(/[^0-9]/g, ''), 10);
  22 |     expect(zoomPct).toBeLessThan(100);
  23 |   });
  24 | 
  25 |   test('drag pans the viewport', async ({ page }) => {
  26 |     // Get initial pan state
  27 |     const initialPan = await page.evaluate(() => {
  28 |       const vp = window.TopologyAPI.engine.viewport;
  29 |       return { panX: vp.panX, panY: vp.panY };
  30 |     });
  31 | 
  32 |     // Drag from (500,500) to (600,400) -> dx=+100, dy=-100
  33 |     await simulateDrag(page, { x: 500, y: 500 }, { x: 600, y: 400 });
  34 | 
  35 |     const newPan = await page.evaluate(() => {
  36 |       const vp = window.TopologyAPI.engine.viewport;
  37 |       return { panX: vp.panX, panY: vp.panY };
  38 |     });
  39 | 
  40 |     expect(newPan.panX).toBeGreaterThan(initialPan.panX);
  41 |     expect(newPan.panY).toBeLessThan(initialPan.panY);
  42 |   });
  43 | 
  44 |   test('zoom UI buttons work', async ({ page }) => {
  45 |     // Click '+' button
  46 |     await page.locator('button', { hasText: '+' }).click();
  47 |     let zoomText = await page.locator('text=/^ZOOM: \\d+%/').innerText();
  48 |     let zoomPct = parseInt(zoomText.replace(/[^0-9]/g, ''), 10);
  49 |     expect(zoomPct).toBe(120); // 100 * 1.2
  50 | 
  51 |     // Click '−' button
  52 |     await page.locator('button', { hasText: '−' }).click();
  53 |     zoomText = await page.locator('text=/^ZOOM: \\d+%/').innerText();
  54 |     zoomPct = parseInt(zoomText.replace(/[^0-9]/g, ''), 10);
  55 |     expect(Math.round(zoomPct)).toBe(100); // 120 * 0.83 ~= 100
  56 |   });
  57 | 
  58 |   test('reset button restores view', async ({ page }) => {
  59 |     // Mess up the view
  60 |     await page.locator('button', { hasText: '+' }).click();
  61 |     await simulateDrag(page, { x: 500, y: 500 }, { x: 800, y: 200 });
  62 | 
  63 |     // Click reset '↺'
  64 |     await page.locator('button', { hasText: '↺' }).click();
  65 | 
  66 |     // Verify reset
  67 |     const zoomText = await page.locator('text=/^ZOOM: \\d+%/').innerText();
  68 |     expect(zoomText).toBe('ZOOM: 100%');
  69 | 
  70 |     const pan = await page.evaluate(() => {
  71 |       const vp = window.TopologyAPI.engine.viewport;
  72 |       return { panX: vp.panX, panY: vp.panY };
  73 |     });
  74 |     expect(pan.panX).toBe(0);
  75 |     expect(pan.panY).toBe(0);
  76 |   });
  77 | 
  78 |   test('fit to screen button adjusts zoom to show all elements', async ({ page }) => {
  79 |     // Create a scenario where elements are off-screen
  80 |     // Generate a huge grid to ensure it overflows the screen initially
  81 |     await page.evaluate(() => window.TopologyAPI.setGrid(10, 10));
  82 |     
  83 |     // Wait for the new large grid to load
  84 |     await page.waitForFunction(() => {
  85 |       return window.TopologyAPI.registry.size > 100;
  86 |     });
  87 | 
  88 |     // The default zoom might not fit a 10x10 grid on screen.
  89 |     // Click fit '⊡'
  90 |     await page.locator('button', { hasText: '⊡' }).click();
  91 | 
  92 |     // Zoom should be much smaller than 100% to fit the big grid
  93 |     const zoomText = await page.locator('text=/^ZOOM: \\d+%/').innerText();
  94 |     const zoomPct = parseInt(zoomText.replace(/[^0-9]/g, ''), 10);
  95 |     expect(zoomPct).toBeLessThan(100);
  96 |   });
  97 | });
  98 | 
```