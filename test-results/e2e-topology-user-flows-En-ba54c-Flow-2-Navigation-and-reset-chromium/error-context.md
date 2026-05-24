# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/topology-user-flows.spec.js >> End-to-End User Flows >> Flow 2: Navigation and reset
- Location: tests/e2e/topology-user-flows.spec.js:33:7

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
        - generic: "ROUTER: router-1-1"
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
  1   | import { test, expect } from '@playwright/test';
  2   | import { navigateAndWait } from '../setup/playwright.setup.js';
  3   | import { simulateClick, simulateHover, simulateDrag, simulateWheel, getElementById } from '../helpers/mouse-simulation.js';
  4   | 
  5   | test.describe('End-to-End User Flows', () => {
  6   |   test.beforeEach(async ({ page }) => {
  7   |     await navigateAndWait(page);
  8   |   });
  9   | 
  10  |   test('Flow 1: Inspect details, clear selection, and hover', async ({ page }) => {
  11  |     // Hover a router
  12  |     const r = await getElementById(page, 'router-1-1');
  13  |     const rScreen = await page.evaluate((pos) => window.TopologyAPI.engine.viewport.toScreen(pos.x, pos.y), { x: r.x, y: r.y });
  14  |     await simulateHover(page, rScreen.x, rScreen.y);
  15  | 
  16  |     await expect(page.locator('text="ROUTER: router-1-1"')).toBeVisible();
  17  | 
  18  |     // Select a bridge
  19  |     const bId = await page.evaluate(() => window.TopologyAPI.querySelectorAll('bridge')[0].id);
  20  |     const b = await getElementById(page, bId);
  21  |     const bScreen = await page.evaluate((pos) => window.TopologyAPI.engine.viewport.toScreen(pos.x, pos.y), { x: b.x, y: b.y });
  22  |     await simulateClick(page, bScreen.x, bScreen.y);
  23  | 
  24  |     // Verify info panel for bridge
  25  |     await expect(page.locator('text="BRIDGE"')).toBeVisible();
  26  |     await expect(page.locator(`text="${bId}"`)).toBeVisible();
  27  | 
  28  |     // Clear selection
  29  |     await page.locator('button[aria-label="Close"]').click();
  30  |     await expect(page.locator('text="BRIDGE"')).not.toBeVisible();
  31  |   });
  32  | 
  33  |   test('Flow 2: Navigation and reset', async ({ page }) => {
  34  |     // Zoom in on center
  35  |     await simulateWheel(page, 640, 360, -500); // 5 wheel ticks in
  36  |     let zoomText = await page.locator('text=/^ZOOM: \\d+%/').innerText();
> 37  |     expect(parseInt(zoomText.replace(/[^0-9]/g, ''), 10)).toBeGreaterThan(100);
      |                                                           ^ Error: expect(received).toBeGreaterThan(expected)
  38  | 
  39  |     // Pan viewport heavily
  40  |     await simulateDrag(page, { x: 640, y: 360 }, { x: 100, y: 100 }, { steps: 5 });
  41  | 
  42  |     // Fit to screen
  43  |     await page.locator('button', { hasText: '⊡' }).click();
  44  |     
  45  |     // Zoom should adjust
  46  |     let newZoomText = await page.locator('text=/^ZOOM: \\d+%/').innerText();
  47  |     expect(newZoomText).not.toBe(zoomText);
  48  | 
  49  |     // Reset view
  50  |     await page.locator('button', { hasText: '↺' }).click();
  51  |     await expect(page.locator('text="ZOOM: 100%"')).toBeVisible();
  52  |   });
  53  | 
  54  |   test('Flow 3: Change grid and validate', async ({ page }) => {
  55  |     // Change to 5x5
  56  |     await page.locator('input[type="number"]').nth(0).fill('5');
  57  |     await page.locator('input[type="number"]').nth(1).fill('5');
  58  |     await page.locator('button', { hasText: 'APPLY' }).click();
  59  | 
  60  |     // Wait for the new grid
  61  |     await page.waitForFunction(() => {
  62  |       // 5x5 = 25 routers. The old one was 3x3=9.
  63  |       return window.TopologyAPI.querySelectorAll('router').length === 25;
  64  |     });
  65  | 
  66  |     const routerCount = await page.evaluate(() => window.TopologyAPI.querySelectorAll('router').length);
  67  |     expect(routerCount).toBe(25);
  68  | 
  69  |     // Click fit to screen so we can see all of it
  70  |     await page.locator('button', { hasText: '⊡' }).click();
  71  | 
  72  |     // Select the last router (router-4-4)
  73  |     await page.evaluate(() => window.TopologyAPI.select('router-4-4'));
  74  |     await expect(page.locator('text="router-4-4"')).toBeVisible();
  75  |   });
  76  | 
  77  |   test('Flow 4: Dynamic styling API', async ({ page }) => {
  78  |     // Color all routers green
  79  |     await page.evaluate(() => {
  80  |       window.TopologyAPI.applyStyle('router', { 
  81  |         fillColor: '#003300', 
  82  |         strokeColor: '#00ff00',
  83  |         labelColor: '#00ff00'
  84  |       });
  85  |       window.TopologyAPI.markDirty();
  86  |     });
  87  | 
  88  |     // We can't easily assert color from the DOM, but we can verify the state object
  89  |     const styles = await page.evaluate(() => {
  90  |       return window.TopologyAPI.getElementById('router-0-0').style;
  91  |     });
  92  | 
  93  |     expect(styles.strokeColor).toBe('#00ff00');
  94  |     expect(styles.fillColor).toBe('#003300');
  95  | 
  96  |     // Make all bridges invisible
  97  |     await page.evaluate(() => {
  98  |       window.TopologyAPI.applyState('bridge', { visible: false });
  99  |       window.TopologyAPI.markDirty();
  100 |     });
  101 | 
  102 |     const isVisible = await page.evaluate(() => {
  103 |       return window.TopologyAPI.querySelectorAll('bridge')[0].state.visible;
  104 |     });
  105 | 
  106 |     expect(isVisible).toBe(false);
  107 |   });
  108 | });
  109 | 
```