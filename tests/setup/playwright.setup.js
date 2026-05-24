// ============================================================
//  PLAYWRIGHT GLOBAL SETUP
//  Reusable helpers for E2E test files.
//  Waits for the topology engine to be fully initialized.
// ============================================================

/**
 * Wait for the TopologyAPI to be defined on window.
 * This indicates the engine is mounted and ready.
 * @param {import('@playwright/test').Page} page
 * @param {number} timeout
 */
export async function waitForTopologyReady(page, timeout = 15000) {
  await page.waitForFunction(
    () => typeof window.TopologyAPI !== 'undefined' && window.TopologyAPI.engine,
    { timeout },
  );
}

/**
 * Wait for the engine to emit a 'loaded' event by checking element count.
 * @param {import('@playwright/test').Page} page
 * @param {number} minCount  minimum expected elements
 */
export async function waitForTopologyLoaded(page, minCount = 1) {
  await page.waitForFunction(
    (min) => {
      const api = window.TopologyAPI;
      return api && api.registry && api.registry.size >= min;
    },
    minCount,
    { timeout: 15000 },
  );
}

/**
 * Wait for at least one animation frame to pass (dirty render).
 * @param {import('@playwright/test').Page} page
 */
export async function waitForRender(page) {
  await page.evaluate(() =>
    new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  );
}

/**
 * Get the canvas element locator.
 * @param {import('@playwright/test').Page} page
 */
export function getCanvas(page) {
  return page.locator('canvas');
}

/**
 * Navigate to the topology page and wait for it to be fully ready.
 * @param {import('@playwright/test').Page} page
 */
export async function navigateAndWait(page) {
  await page.goto('/', { waitUntil: 'networkidle' });
  await waitForTopologyReady(page);
  await waitForRender(page);
}
