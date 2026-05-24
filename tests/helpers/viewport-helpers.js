// ============================================================
//  VIEWPORT HELPERS
//  Assertion utilities for validating coordinate transforms,
//  zoom focal point stability, and fit-to-bbox correctness.
// ============================================================

import { expect } from 'vitest';
import { ViewportManager } from '../../src/lib/topology/renderer/viewport.js';

const FLOAT_TOLERANCE = 0.0001;

/**
 * Assert that toWorld→toScreen round-trips back to the original screen coords.
 * @param {ViewportManager} vp
 * @param {number} sx  screen x
 * @param {number} sy  screen y
 */
export function assertScreenRoundTrip(vp, sx, sy) {
  const world = vp.toWorld(sx, sy);
  const back = vp.toScreen(world.x, world.y);
  expect(Math.abs(back.x - sx)).toBeLessThan(FLOAT_TOLERANCE);
  expect(Math.abs(back.y - sy)).toBeLessThan(FLOAT_TOLERANCE);
}

/**
 * Assert that toScreen→toWorld round-trips back to the original world coords.
 * @param {ViewportManager} vp
 * @param {number} wx  world x
 * @param {number} wy  world y
 */
export function assertWorldRoundTrip(vp, wx, wy) {
  const screen = vp.toScreen(wx, wy);
  const back = vp.toWorld(screen.x, screen.y);
  expect(Math.abs(back.x - wx)).toBeLessThan(FLOAT_TOLERANCE);
  expect(Math.abs(back.y - wy)).toBeLessThan(FLOAT_TOLERANCE);
}

/**
 * Assert that after zooming at a focal point, the world coordinate
 * under that screen point stays the same.
 * @param {ViewportManager} vp
 * @param {number} sx  focal screen x
 * @param {number} sy  focal screen y
 * @param {number} factor  zoom factor
 */
export function assertZoomFocalStable(vp, sx, sy, factor) {
  const worldBefore = vp.toWorld(sx, sy);
  vp.zoomAt(factor, sx, sy);
  const worldAfter = vp.toWorld(sx, sy);
  expect(Math.abs(worldAfter.x - worldBefore.x)).toBeLessThan(FLOAT_TOLERANCE);
  expect(Math.abs(worldAfter.y - worldBefore.y)).toBeLessThan(FLOAT_TOLERANCE);
}

/**
 * Assert that after fitToBBox, the entire bbox is visible on screen.
 * Checks that all four corners of the bbox map to within the viewport.
 * @param {ViewportManager} vp
 * @param {{ x: number, y: number, width: number, height: number }} bbox
 */
export function assertFitContainsBBox(vp, bbox) {
  const corners = [
    { x: bbox.x, y: bbox.y },
    { x: bbox.x + bbox.width, y: bbox.y },
    { x: bbox.x, y: bbox.y + bbox.height },
    { x: bbox.x + bbox.width, y: bbox.y + bbox.height },
  ];

  for (const corner of corners) {
    const screen = vp.toScreen(corner.x, corner.y);
    expect(screen.x).toBeGreaterThanOrEqual(-1);
    expect(screen.y).toBeGreaterThanOrEqual(-1);
    expect(screen.x).toBeLessThanOrEqual(vp._w + 1);
    expect(screen.y).toBeLessThanOrEqual(vp._h + 1);
  }
}

/**
 * Create a viewport at a specific zoom/pan state for testing.
 * @param {number} zoom
 * @param {number} panX
 * @param {number} panY
 * @param {number} width
 * @param {number} height
 * @returns {ViewportManager}
 */
export function createViewportAt(zoom = 1, panX = 0, panY = 0, width = 1280, height = 720) {
  const vp = new ViewportManager();
  vp.setSize(width, height);
  vp.zoom = zoom;
  vp.panX = panX;
  vp.panY = panY;
  return vp;
}
