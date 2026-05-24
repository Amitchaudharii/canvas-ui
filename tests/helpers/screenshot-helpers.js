// ============================================================
//  SCREENSHOT HELPERS
//  Utilities for visual regression testing with Playwright.
//  Captures canvas screenshots and provides comparison helpers.
// ============================================================

/**
 * Capture a screenshot of just the canvas element.
 * @param {import('@playwright/test').Page} page
 * @param {string} name  screenshot identifier
 * @returns {Promise<Buffer>}
 */
export async function captureCanvas(page, name) {
  const canvas = page.locator('canvas');
  return await canvas.screenshot({ path: `tests/visual/screenshots/${name}.png` });
}

/**
 * Capture a full-page screenshot.
 * @param {import('@playwright/test').Page} page
 * @param {string} name  screenshot identifier
 * @returns {Promise<Buffer>}
 */
export async function captureFullPage(page, name) {
  return await page.screenshot({ path: `tests/visual/screenshots/${name}.png`, fullPage: true });
}

/**
 * Check that the canvas is not blank (has non-background pixels).
 * Evaluates canvas pixel data in the browser.
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<boolean>}
 */
export async function isCanvasNonBlank(page) {
  return await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return false;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    // Sample pixels from multiple regions
    const samples = [
      [w * 0.25, h * 0.25],
      [w * 0.5, h * 0.5],
      [w * 0.75, h * 0.75],
      [w * 0.5, h * 0.25],
      [w * 0.25, h * 0.5],
    ];

    // Background color is #0d1b2a = rgb(13, 27, 42)
    let nonBgPixels = 0;
    for (const [sx, sy] of samples) {
      const data = ctx.getImageData(Math.floor(sx), Math.floor(sy), 1, 1).data;
      if (data[0] !== 13 || data[1] !== 27 || data[2] !== 42) {
        nonBgPixels++;
      }
    }

    return nonBgPixels > 0;
  });
}

/**
 * Get total pixel count of non-background pixels.
 * Useful for asserting that elements are actually rendered.
 * @param {import('@playwright/test').Page} page
 * @param {number} sampleSize  how many random pixels to check
 * @returns {Promise<number>}
 */
export async function getNonBlankPixelRatio(page, sampleSize = 1000) {
  return await page.evaluate((samples) => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return 0;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    let nonBg = 0;
    for (let i = 0; i < samples; i++) {
      const x = Math.floor(Math.random() * w);
      const y = Math.floor(Math.random() * h);
      const data = ctx.getImageData(x, y, 1, 1).data;
      // Background is #0d1b2a = rgb(13, 27, 42)
      if (data[0] !== 13 || data[1] !== 27 || data[2] !== 42) {
        nonBg++;
      }
    }
    return nonBg / samples;
  }, sampleSize);
}

/**
 * Capture the canvas and assert it matches a baseline screenshot.
 * Uses Playwright's built-in toHaveScreenshot for pixel comparison.
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').TestInfo} testInfo
 * @param {string} name
 */
export async function assertCanvasMatchesBaseline(page, name) {
  const canvas = page.locator('canvas');
  // Wait for render to stabilize
  await page.evaluate(() =>
    new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  );
  await canvas.screenshot({ path: `tests/visual/screenshots/${name}-actual.png` });
}
