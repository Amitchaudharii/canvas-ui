// ============================================================
//  ELEMENT FACTORY
//  Converts raw backend config objects → runtime elements.
//  All default values live here — keeps config payloads small.
//
//  Connection model (after refactor):
//    ConnectionConfig  — the backend group (fromId, toId, lineCount)
//    ConnectionLine    — one individual line, independently registered
//
//  Each line gets its own id:  "{connId}-line-{index}"
//  Each line is independently selectable, styleable, hoverable.
// ============================================================

function makeState(overrides = {}) {
  return {
    selected: false,
    hovered: false,
    visible: true,
    disabled: false,
    zIndex: 0,
    ...overrides,
  };
}

export function createRouter(cfg) {
  return {
    id: cfg.id,
    type: "router",
    className: "router",
    x: cfg.x,
    y: cfg.y,
    label: cfg.label ?? cfg.id,
    radius: cfg.radius ?? 46,
    style: {},
    state: makeState({ zIndex: 10 }),
    meta: cfg.meta ?? {},
  };
}

export function createBridge(cfg) {
  return {
    id: cfg.id,
    type: "bridge",
    className: "bridge",
    x: cfg.x,
    y: cfg.y,
    label: cfg.label ?? "V",
    radius: cfg.radius ?? 18,
    routerId: cfg.routerId,
    style: {},
    state: makeState({ zIndex: 5 }),
    meta: cfg.meta ?? {},
  };
}

/**
 * Explode one ConnectionConfig into N individual ConnectionLine elements.
 * Each line is its own independently registered element.
 *
 * @param {object} cfg  ConnectionConfig from backend
 * @returns {object[]}  Array of ConnectionLine elements (one per line)
 */
export function createConnectionLines(cfg) {
  const count = Math.max(1, cfg.lineCount ?? 1);
  const direction = cfg.direction ?? "from";
  const spacing = 3.5;
  const startOff = (-(count - 1) / 2) * spacing;

  return Array.from({ length: count }, (_, i) => ({
    id: `${cfg.id}-line-${i}`,
    type: "connection-line",
    className: "connection-line",
    x: 0,
    y: 0,

    // Parent connection reference
    connectionId: cfg.id,
    fromId: cfg.fromId,
    toId: cfg.toId,
    direction,

    // This line's perpendicular offset in the bundle
    offset: startOff + i * spacing,

    // Which line in the group (0-based)
    lineIndex: i,
    lineTotal: count,

    style: {},
    state: makeState({ zIndex: 1 }),
    meta: {
      ...(cfg.meta ?? {}),
      lineIndex: i,
      lineTotal: count,
      connectionId: cfg.id,
    },
  }));
}
