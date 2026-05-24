# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/topology-interaction.spec.js >> Topology Interactions >> InfoPanel close button clears selection
- Location: tests/e2e/topology-interaction.spec.js:109:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text="ROUTER"')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text="ROUTER"')

```

```yaml
- text: GRID ROWS
- button "−"
- spinbutton: "3"
- button "+"
- text: × COLS
- button "−"
- spinbutton: "3"
- button "+"
- button "APPLY"
- text: "ELEMENTS: 227 ROUTER: router-0-0"
- button "+"
- button "−"
- button "⊡"
- button "↺"
- text: "ZOOM: 74% FROM → ← TO ↔ BOTH router"
- button "Close": ×
- text: id router-0-0 label 0-0 x 200 y 160 radius 46 row 0 col 0 status active
- alert
```

# Test source

```ts
  11  |     // Find a router's world position from the API
  12  |     const el = await getElementById(page, 'router-1-1'); // center router in 3x3
  13  |     expect(el).not.toBeNull();
  14  | 
  15  |     // Convert world to screen via API
  16  |     const screen = await page.evaluate((pos) => {
  17  |       return window.TopologyAPI.engine.viewport.toScreen(pos.x, pos.y);
  18  |     }, { x: el.x, y: el.y });
  19  | 
  20  |     // Hover that screen position
  21  |     await simulateHover(page, screen.x, screen.y);
  22  | 
  23  |     // Verify HUD updates
  24  |     const hudHighlight = page.locator('div', { hasText: /^ROUTER: router-1-1$/ });
  25  |     await expect(hudHighlight).toBeVisible();
  26  | 
  27  |     // Cursor should be pointer
  28  |     const canvas = getCanvas(page);
  29  |     await expect(canvas).toHaveCSS('cursor', 'pointer');
  30  |   });
  31  | 
  32  |   test('clicking empty space clears selection', async ({ page }) => {
  33  |     // First select something programmatically
  34  |     await page.evaluate(() => window.TopologyAPI.select('router-0-0'));
  35  |     
  36  |     // Verify InfoPanel is open
  37  |     await expect(page.locator('text="router-0-0"')).toBeVisible();
  38  | 
  39  |     // Click near top-left corner (0,0 is usually empty in the grid)
  40  |     await simulateClick(page, 10, 10);
  41  | 
  42  |     // InfoPanel should disappear
  43  |     await expect(page.locator('text="router-0-0"')).not.toBeVisible();
  44  |   });
  45  | 
  46  |   test('clicking a router opens InfoPanel', async ({ page }) => {
  47  |     const el = await getElementById(page, 'router-0-0');
  48  |     const screen = await page.evaluate((pos) => {
  49  |       return window.TopologyAPI.engine.viewport.toScreen(pos.x, pos.y);
  50  |     }, { x: el.x, y: el.y });
  51  | 
  52  |     await simulateClick(page, screen.x, screen.y);
  53  | 
  54  |     // InfoPanel appears with router properties
  55  |     await expect(page.locator('text="ROUTER"')).toBeVisible();
  56  |     await expect(page.locator('text="router-0-0"')).toBeVisible();
  57  |     await expect(page.locator('text="radius"')).toBeVisible();
  58  |   });
  59  | 
  60  |   test('clicking a bridge opens InfoPanel', async ({ page }) => {
  61  |     // Query all bridges to find one to click
  62  |     const bridges = await queryElements(page, 'bridge');
  63  |     const targetId = bridges[0].id;
  64  |     
  65  |     const el = await getElementById(page, targetId);
  66  |     const screen = await page.evaluate((pos) => {
  67  |       return window.TopologyAPI.engine.viewport.toScreen(pos.x, pos.y);
  68  |     }, { x: el.x, y: el.y });
  69  | 
  70  |     await simulateClick(page, screen.x, screen.y);
  71  | 
  72  |     await expect(page.locator('text="BRIDGE"')).toBeVisible();
  73  |     await expect(page.locator(`text="${targetId}"`)).toBeVisible();
  74  |     await expect(page.locator('text="routerId"')).toBeVisible();
  75  |   });
  76  | 
  77  |   test('clicking a connection line opens InfoPanel', async ({ page }) => {
  78  |     // Connection lines have an offset, so we click the middle of the offset line
  79  |     const lines = await queryElements(page, 'connection-line');
  80  |     const targetId = lines[0].id;
  81  |     
  82  |     // Have the browser evaluate the exact hit point on the screen
  83  |     const screen = await page.evaluate((id) => {
  84  |       const line = window.TopologyAPI.getElementById(id);
  85  |       const from = window.TopologyAPI.getElementById(line.fromId);
  86  |       const to = window.TopologyAPI.getElementById(line.toId);
  87  |       
  88  |       const dx = to.x - from.x;
  89  |       const dy = to.y - from.y;
  90  |       const len = Math.sqrt(dx*dx + dy*dy) || 1;
  91  |       const nx = -dy / len;
  92  |       const ny = dx / len;
  93  |       
  94  |       // Middle of the line, adjusted by perpendicular offset
  95  |       const mx = (from.x + to.x) / 2 + nx * line.offset;
  96  |       const my = (from.y + to.y) / 2 + ny * line.offset;
  97  |       
  98  |       return window.TopologyAPI.engine.viewport.toScreen(mx, my);
  99  |     }, targetId);
  100 | 
  101 |     await simulateClick(page, screen.x, screen.y);
  102 | 
  103 |     await expect(page.locator('text="CONNECTION-LINE"')).toBeVisible();
  104 |     await expect(page.locator(`text="${targetId}"`)).toBeVisible();
  105 |     await expect(page.locator('text="lineIndex"')).toBeVisible();
  106 |     await expect(page.locator('text="offset"')).toBeVisible();
  107 |   });
  108 | 
  109 |   test('InfoPanel close button clears selection', async ({ page }) => {
  110 |     await page.evaluate(() => window.TopologyAPI.select('router-0-0'));
> 111 |     await expect(page.locator('text="ROUTER"')).toBeVisible();
      |                                                 ^ Error: expect(locator).toBeVisible() failed
  112 | 
  113 |     // Click the X button (which is the only button in the InfoPanel header)
  114 |     await page.locator('button[aria-label="Close"]').click();
  115 | 
  116 |     await expect(page.locator('text="ROUTER"')).not.toBeVisible();
  117 |   });
  118 | });
  119 | 
```