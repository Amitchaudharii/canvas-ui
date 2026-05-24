# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: visual/topology-visual.spec.js >> Visual Regression >> default topology renders consistently @visual
- Location: tests/visual/topology-visual.spec.js:19:7

# Error details

```
Error: A snapshot doesn't exist at /Users/jayantchaudhary/Documents/canvas-ui/tests/visual/screenshots/visual/topology-visual.spec.js-snapshots/topology-default-chromium-darwin.png, writing actual.
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - button "Open Next.js Dev Tools" [ref=e10] [cursor=pointer]:
    - img [ref=e11]
  - alert [ref=e14]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { navigateAndWait } from '../setup/playwright.setup.js';
  3  | import { simulateHover, simulateClick, getElementById } from '../helpers/mouse-simulation.js';
  4  | 
  5  | test.describe('Visual Regression', () => {
  6  |   // Use @visual tag so we can run these isolated
  7  |   test.beforeEach(async ({ page }) => {
  8  |     await navigateAndWait(page);
  9  |     
  10 |     // For stable screenshots, we need to hide the UI overlays
  11 |     // because HUD shows dynamic values like elements count or cursor position
  12 |     await page.evaluate(() => {
  13 |       document.querySelectorAll('div[style*="fixed"]').forEach(el => {
  14 |         el.style.display = 'none';
  15 |       });
  16 |     });
  17 |   });
  18 | 
  19 |   test('default topology renders consistently @visual', async ({ page }) => {
  20 |     // We already hid the overlays, so just screenshot the canvas
  21 |     const canvas = page.locator('canvas');
> 22 |     await expect(canvas).toHaveScreenshot('topology-default.png');
     |     ^ Error: A snapshot doesn't exist at /Users/jayantchaudhary/Documents/canvas-ui/tests/visual/screenshots/visual/topology-visual.spec.js-snapshots/topology-default-chromium-darwin.png, writing actual.
  23 |   });
  24 | 
  25 |   test('router hover state @visual', async ({ page }) => {
  26 |     // Find router-1-1
  27 |     const el = await getElementById(page, 'router-1-1');
  28 |     const screen = await page.evaluate((pos) => window.TopologyAPI.engine.viewport.toScreen(pos.x, pos.y), { x: el.x, y: el.y });
  29 |     
  30 |     await simulateHover(page, screen.x, screen.y);
  31 |     
  32 |     const canvas = page.locator('canvas');
  33 |     await expect(canvas).toHaveScreenshot('topology-router-hover.png');
  34 |   });
  35 | 
  36 |   test('bridge selection state @visual', async ({ page }) => {
  37 |     // Select first bridge
  38 |     await page.evaluate(() => {
  39 |       const bId = window.TopologyAPI.querySelectorAll('bridge')[0].id;
  40 |       window.TopologyAPI.select(bId);
  41 |     });
  42 | 
  43 |     const canvas = page.locator('canvas');
  44 |     await expect(canvas).toHaveScreenshot('topology-bridge-selected.png');
  45 |   });
  46 | 
  47 |   test('zoomed in view @visual', async ({ page }) => {
  48 |     await page.evaluate(() => {
  49 |       window.TopologyAPI.engine.viewport.zoomAt(2.0, 640, 360);
  50 |       window.TopologyAPI.markDirty();
  51 |     });
  52 | 
  53 |     // Wait a frame
  54 |     await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  55 | 
  56 |     const canvas = page.locator('canvas');
  57 |     await expect(canvas).toHaveScreenshot('topology-zoomed-in.png');
  58 |   });
  59 |   
  60 |   test('custom styled elements via API @visual', async ({ page }) => {
  61 |     await page.evaluate(() => {
  62 |       // Style all bridges
  63 |       window.TopologyAPI.applyStyle('bridge', { 
  64 |         fillColor: '#880000', 
  65 |         strokeColor: '#ff4444' 
  66 |       });
  67 |       // Select central router
  68 |       window.TopologyAPI.select('router-1-1');
  69 |       window.TopologyAPI.markDirty();
  70 |     });
  71 | 
  72 |     // Wait a frame
  73 |     await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  74 | 
  75 |     const canvas = page.locator('canvas');
  76 |     await expect(canvas).toHaveScreenshot('topology-custom-styled.png');
  77 |   });
  78 | });
  79 | 
```