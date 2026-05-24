// ============================================================
//  MOUSE SIMULATION HELPERS
//  Playwright-based helpers for simulating mouse, wheel, and
//  touch interactions on the canvas element.
// ============================================================

/**
 * Simulate a click at canvas-relative coordinates.
 * @param {import('@playwright/test').Page} page
 * @param {number} x
 * @param {number} y
 */
export async function simulateClick(page, x, y) {
  const canvas = page.locator('canvas');
  await canvas.click({ position: { x, y } });
}

/**
 * Simulate a drag from one position to another.
 * @param {import('@playwright/test').Page} page
 * @param {{ x: number, y: number }} from
 * @param {{ x: number, y: number }} to
 * @param {{ steps?: number }} options
 */
export async function simulateDrag(page, from, to, options = {}) {
  const { steps = 10 } = options;
  const canvas = page.locator('canvas');
  const box = await canvas.boundingBox();

  const startX = box.x + from.x;
  const startY = box.y + from.y;
  const endX = box.x + to.x;
  const endY = box.y + to.y;

  await page.mouse.move(startX, startY);
  await page.mouse.down();

  // Move in steps for smooth drag
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    await page.mouse.move(
      startX + (endX - startX) * t,
      startY + (endY - startY) * t,
    );
  }

  await page.mouse.up();
}

/**
 * Simulate a scroll wheel event for zooming.
 * @param {import('@playwright/test').Page} page
 * @param {number} x  canvas-relative x
 * @param {number} y  canvas-relative y
 * @param {number} deltaY  negative = zoom in, positive = zoom out
 */
export async function simulateWheel(page, x, y, deltaY) {
  const canvas = page.locator('canvas');
  const box = await canvas.boundingBox();

  await page.mouse.move(box.x + x, box.y + y);
  await page.mouse.wheel(0, deltaY);
}

/**
 * Simulate a hover at canvas-relative coordinates.
 * @param {import('@playwright/test').Page} page
 * @param {number} x
 * @param {number} y
 */
export async function simulateHover(page, x, y) {
  const canvas = page.locator('canvas');
  const box = await canvas.boundingBox();
  await page.mouse.move(box.x + x, box.y + y);
}

/**
 * Wait for a render frame to complete.
 * @param {import('@playwright/test').Page} page
 */
export async function waitForRender(page) {
  await page.evaluate(() =>
    new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  );
}

/**
 * Get the current TopologyAPI state from the page.
 * @param {import('@playwright/test').Page} page
 */
export async function getTopologyState(page) {
  return await page.evaluate(() => {
    const api = window.TopologyAPI;
    if (!api) return null;
    return {
      elementCount: api.registry.size,
      hasEngine: !!api.engine,
      hasRegistry: !!api.registry,
    };
  });
}

/**
 * Get element info from the TopologyAPI by id.
 * @param {import('@playwright/test').Page} page
 * @param {string} id
 */
export async function getElementById(page, id) {
  return await page.evaluate((elId) => {
    const el = window.TopologyAPI?.getElementById(elId);
    if (!el) return null;
    return {
      id: el.id,
      type: el.type,
      className: el.className,
      x: el.x,
      y: el.y,
      state: { ...el.state },
      style: { ...el.style },
      meta: { ...el.meta },
    };
  }, id);
}

/**
 * Query elements by selector via TopologyAPI.
 * @param {import('@playwright/test').Page} page
 * @param {string} selector
 */
export async function queryElements(page, selector) {
  return await page.evaluate((sel) => {
    const elements = window.TopologyAPI?.querySelectorAll(sel);
    if (!elements) return [];
    return elements.map(el => ({
      id: el.id,
      type: el.type,
      className: el.className,
    }));
  }, selector);
}
