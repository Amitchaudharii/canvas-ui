// ============================================================
//  MOCK CONFIG GENERATOR
//  Seeded LCG random → same output on server AND client.
//  No hydration mismatch.
//
//  Replace generateMockConfig() in page.js with a real DB call.
// ============================================================

import { bridgePositionsAround } from './layout.js';

/**
 * Generate a deterministic mock topology config.
 *
 * @param {{
 *   rows?:     number,
 *   cols?:     number,
 *   spacingX?: number,
 *   spacingY?: number,
 *   startX?:   number,
 *   startY?:   number,
 *   seed?:     number
 * }} opts
 * @returns {{ routers: object[], bridges: object[], connections: object[] }}
 */
export function generateMockConfig(opts = {}) {
  const {
    rows     = 3,
    cols     = 3,
    spacingX = 320,
    spacingY = 300,
    startX   = 200,
    startY   = 160,
    seed     = 42,
  } = opts;

  // Seeded LCG — same sequence every call with the same seed
  let s = seed;
  const rand = () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return Math.abs(s) / 0x7fffffff;
  };

  const DIRS = ['from', 'to', 'bidirectional'];

  const routers     = [];
  const bridges     = [];
  const connections = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x   = startX + col * spacingX;
      const y   = startY + row * spacingY;
      const rid = `router-${row}-${col}`;

      routers.push({
        id:     rid,
        label:  `${row}-${col}`,
        x,
        y,
        radius: 46,
        meta:   { row, col, status: 'active' },
      });

      // 4–8 bridges per router
      const bridgeCount = 4 + Math.floor(rand() * 5);
      const positions   = bridgePositionsAround({ x, y }, bridgeCount, { orbit: 108 });

      for (let bi = 0; bi < bridgeCount; bi++) {
        const bid = `bridge-${row}-${col}-${bi}`;

        bridges.push({
          id:       bid,
          label:    'V',
          x:        positions[bi].x,
          y:        positions[bi].y,
          routerId: rid,
          radius:   18,
          meta:     { index: bi, parent: rid },
        });

        // 1–9 lines, random direction
        const lineCount = rand() > 0.65 ? 2 + Math.floor(rand() * 7) : 1;
        const direction = DIRS[Math.floor(rand() * 3)];

        connections.push({
          id:        `conn-${bid}`,
          fromId:    rid,
          toId:      bid,
          direction,
          lineCount,
          meta:      { type: 'router-bridge' },
        });
      }
    }
  }

  // Horizontal router ↔ router links
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols - 1; col++) {
      const direction = col % 2 === 0 ? 'from' : 'to';
      connections.push({
        id:        `rconn-h-${row}-${col}`,
        fromId:    `router-${row}-${col}`,
        toId:      `router-${row}-${col + 1}`,
        direction,
        lineCount: col === 1 ? 7 : 3,
        meta:      { type: 'router-router', axis: 'horizontal' },
      });
    }
  }

  // Vertical router ↔ router links (center column only)
  for (let row = 0; row < rows - 1; row++) {
    connections.push({
      id:        `rconn-v-${row}`,
      fromId:    `router-${row}-1`,
      toId:      `router-${row + 1}-1`,
      direction: 'bidirectional',
      lineCount: 9,
      meta:      { type: 'router-router', axis: 'vertical' },
    });
  }

  return { routers, bridges, connections };
}
