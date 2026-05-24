// ============================================================
//  TOPOLOGY GENERATORS
//  Reusable config generators for unit and E2E tests.
//  Uses the same structure as the real mock.js but with
//  simpler, deterministic data for focused testing.
// ============================================================

/**
 * Create a minimal topology config: 1 router, 1 bridge, 1 connection (1 line).
 * Useful for isolated single-element tests.
 */
export function createMinimalConfig() {
  return {
    routers: [
      { id: 'router-0-0', label: '0-0', x: 200, y: 200, radius: 46, meta: { status: 'active' } },
    ],
    bridges: [
      { id: 'bridge-0-0-0', label: 'V', x: 200, y: 92, routerId: 'router-0-0', radius: 18, meta: { index: 0 } },
    ],
    connections: [
      { id: 'conn-bridge-0-0-0', fromId: 'router-0-0', toId: 'bridge-0-0-0', direction: 'from', lineCount: 1, meta: { type: 'router-bridge' } },
    ],
  };
}

/**
 * Create a two-router topology with an inter-router connection.
 * Tests router-to-router lines and multi-line bundles.
 */
export function createTwoRouterConfig() {
  return {
    routers: [
      { id: 'router-0-0', label: '0-0', x: 200, y: 200, radius: 46, meta: {} },
      { id: 'router-0-1', label: '0-1', x: 520, y: 200, radius: 46, meta: {} },
    ],
    bridges: [
      { id: 'bridge-0-0-0', label: 'V', x: 200, y: 92, routerId: 'router-0-0', radius: 18, meta: {} },
      { id: 'bridge-0-1-0', label: 'V', x: 520, y: 92, routerId: 'router-0-1', radius: 18, meta: {} },
    ],
    connections: [
      { id: 'conn-bridge-0-0-0', fromId: 'router-0-0', toId: 'bridge-0-0-0', direction: 'from', lineCount: 1, meta: { type: 'router-bridge' } },
      { id: 'conn-bridge-0-1-0', fromId: 'router-0-1', toId: 'bridge-0-1-0', direction: 'to', lineCount: 1, meta: { type: 'router-bridge' } },
      { id: 'rconn-h-0-0', fromId: 'router-0-0', toId: 'router-0-1', direction: 'from', lineCount: 3, meta: { type: 'router-router' } },
    ],
  };
}

/**
 * Create a config specifically for testing connection line explosion.
 * @param {number} lineCount  number of lines in the bundle
 * @param {string} direction  'from' | 'to' | 'bidirectional'
 */
export function createConnectionBundleConfig(lineCount = 3, direction = 'from') {
  return {
    routers: [
      { id: 'r1', label: 'R1', x: 100, y: 200, radius: 46, meta: {} },
    ],
    bridges: [
      { id: 'b1', label: 'B1', x: 400, y: 200, routerId: 'r1', radius: 18, meta: {} },
    ],
    connections: [
      { id: 'conn-1', fromId: 'r1', toId: 'b1', direction, lineCount, meta: { type: 'router-bridge' } },
    ],
  };
}

/**
 * Create a config with all three direction types for arrow testing.
 */
export function createAllDirectionsConfig() {
  return {
    routers: [
      { id: 'r-center', label: 'C', x: 400, y: 300, radius: 46, meta: {} },
    ],
    bridges: [
      { id: 'b-from', label: 'F', x: 400, y: 150, routerId: 'r-center', radius: 18, meta: {} },
      { id: 'b-to', label: 'T', x: 550, y: 300, routerId: 'r-center', radius: 18, meta: {} },
      { id: 'b-bi', label: 'B', x: 400, y: 450, routerId: 'r-center', radius: 18, meta: {} },
    ],
    connections: [
      { id: 'conn-from', fromId: 'r-center', toId: 'b-from', direction: 'from', lineCount: 1, meta: {} },
      { id: 'conn-to', fromId: 'r-center', toId: 'b-to', direction: 'to', lineCount: 1, meta: {} },
      { id: 'conn-bi', fromId: 'r-center', toId: 'b-bi', direction: 'bidirectional', lineCount: 1, meta: {} },
    ],
  };
}

/**
 * Create an empty config — no elements.
 */
export function createEmptyConfig() {
  return { routers: [], bridges: [], connections: [] };
}

/**
 * Create a stress test config with many elements.
 * @param {number} rows
 * @param {number} cols
 */
export function createStressConfig(rows = 10, cols = 10) {
  const routers = [];
  const bridges = [];
  const connections = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const rid = `router-${row}-${col}`;
      routers.push({
        id: rid,
        label: `${row}-${col}`,
        x: 200 + col * 320,
        y: 160 + row * 300,
        radius: 46,
        meta: { row, col },
      });

      // 4 bridges per router
      const orbit = 108;
      for (let bi = 0; bi < 4; bi++) {
        const angle = -Math.PI / 2 + (2 * Math.PI / 4) * bi;
        const bid = `bridge-${row}-${col}-${bi}`;
        bridges.push({
          id: bid,
          label: 'V',
          x: 200 + col * 320 + Math.cos(angle) * orbit,
          y: 160 + row * 300 + Math.sin(angle) * orbit,
          routerId: rid,
          radius: 18,
          meta: {},
        });

        connections.push({
          id: `conn-${bid}`,
          fromId: rid,
          toId: bid,
          direction: 'from',
          lineCount: 2,
          meta: { type: 'router-bridge' },
        });
      }

      // Horizontal router-router links
      if (col < cols - 1) {
        connections.push({
          id: `rconn-h-${row}-${col}`,
          fromId: rid,
          toId: `router-${row}-${col + 1}`,
          direction: 'from',
          lineCount: 3,
          meta: { type: 'router-router' },
        });
      }
    }
  }

  return { routers, bridges, connections };
}

/**
 * Create a single-element config for isolated type testing.
 * @param {'router'|'bridge'} type
 */
export function createSingleElementConfig(type) {
  if (type === 'router') {
    return {
      routers: [{ id: 'solo-router', label: 'SOLO', x: 400, y: 300, radius: 46, meta: { solo: true } }],
      bridges: [],
      connections: [],
    };
  }
  // Bridge requires a router for connection reference
  return {
    routers: [{ id: 'parent-router', label: 'P', x: 400, y: 300, radius: 46, meta: {} }],
    bridges: [{ id: 'solo-bridge', label: 'SB', x: 400, y: 192, routerId: 'parent-router', radius: 18, meta: { solo: true } }],
    connections: [],
  };
}
