// ============================================================
//  LAYOUT UTILITIES
//  Pure position math. No DOM, no React, no canvas.
//  Use when backend omits x/y, or for initial placement.
// ============================================================

/**
 * Auto-assign x/y to routers in a grid pattern.
 * Existing x/y values from the backend are preserved.
 *
 * @param {object[]} routers
 * @param {{ cols?, spacingX?, spacingY?, offsetX?, offsetY? }} opts
 * @returns {object[]}
 */
export function applyGridLayout(routers, opts = {}) {
  const {
    cols     = 3,
    spacingX = 320,
    spacingY = 300,
    offsetX  = 200,
    offsetY  = 160,
  } = opts;

  return routers.map((r, i) => ({
    ...r,
    x: r.x ?? offsetX + (i % cols) * spacingX,
    y: r.y ?? offsetY + Math.floor(i / cols) * spacingY,
  }));
}

/**
 * Return positions for `count` bridges evenly distributed
 * in a circle around `center`.
 *
 * @param {{ x: number, y: number }} center
 * @param {number} count
 * @param {{ orbit?: number, startAngle?: number }} opts
 * @returns {{ x: number, y: number }[]}
 */
export function bridgePositionsAround(center, count, opts = {}) {
  const { orbit = 108, startAngle = -Math.PI / 2 } = opts;

  return Array.from({ length: count }, (_, i) => {
    const angle = startAngle + (2 * Math.PI / count) * i;
    return {
      x: center.x + Math.cos(angle) * orbit,
      y: center.y + Math.sin(angle) * orbit,
    };
  });
}

/**
 * Simple iterative overlap resolution.
 * Prevents bridges from stacking when orbit is tight.
 *
 * @param {object[]} bridges
 * @param {number} minDist
 * @param {number} iterations
 * @returns {object[]}
 */
export function nudgeOverlaps(bridges, minDist = 40, iterations = 3) {
  const els = bridges.map(b => ({ ...b }));

  for (let iter = 0; iter < iterations; iter++) {
    for (let i = 0; i < els.length; i++) {
      for (let j = i + 1; j < els.length; j++) {
        const dx   = els[j].x - els[i].x;
        const dy   = els[j].y - els[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
        if (dist < minDist) {
          const push = (minDist - dist) / 2;
          const nx = dx / dist, ny = dy / dist;
          els[i].x -= nx * push;
          els[i].y -= ny * push;
          els[j].x += nx * push;
          els[j].y += ny * push;
        }
      }
    }
  }
  return els;
}

/**
 * Compute axis-aligned bounding box from a list of {x, y} points.
 *
 * @param {{ x: number, y: number }[]} elements
 * @returns {{ x: number, y: number, width: number, height: number }}
 */
export function computeBBox(elements) {
  if (elements.length === 0) return { x: 0, y: 0, width: 0, height: 0 };

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const el of elements) {
    if (minX > el.x) minX = el.x;
    if (minY > el.y) minY = el.y;
    if (maxX < el.x) maxX = el.x;
    if (maxY < el.y) maxY = el.y;
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}
