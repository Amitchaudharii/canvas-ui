// ============================================================
//  ELEMENT FACTORY
//  Converts raw backend config objects → runtime elements.
//  All default values live here — keeps config payloads small.
// ============================================================

/**
 * Default state applied to every element.
 * @returns {object}
 */
function makeState(overrides = {}) {
  return {
    selected: false,
    hovered:  false,
    visible:  true,
    disabled: false,
    zIndex:   0,
    ...overrides,
  };
}

/**
 * Create a router element from backend config.
 *
 * Config shape:
 *   { id, label?, x, y, radius?, meta? }
 *
 * @param {object} cfg
 * @returns {object} RouterElement
 */
export function createRouter(cfg) {
  return {
    id:        cfg.id,
    type:      'router',
    className: 'router',
    x:         cfg.x,
    y:         cfg.y,
    label:     cfg.label  ?? cfg.id,
    radius:    cfg.radius ?? 46,
    style:     {},
    state:     makeState({ zIndex: 10 }),
    meta:      cfg.meta ?? {},
  };
}

/**
 * Create a bridge element from backend config.
 *
 * Config shape:
 *   { id, label?, x, y, radius?, routerId, meta? }
 *
 * @param {object} cfg
 * @returns {object} BridgeElement
 */
export function createBridge(cfg) {
  return {
    id:        cfg.id,
    type:      'bridge',
    className: 'bridge',
    x:         cfg.x,
    y:         cfg.y,
    label:     cfg.label  ?? 'V',
    radius:    cfg.radius ?? 18,
    routerId:  cfg.routerId,
    style:     {},
    state:     makeState({ zIndex: 5 }),
    meta:      cfg.meta ?? {},
  };
}

/**
 * Create a connection element from backend config.
 *
 * Config shape:
 *   { id, fromId, toId, direction?, lineCount?, meta? }
 *
 * direction values:
 *   'from'          → arrowhead toward toId   (blue)
 *   'to'            → arrowhead toward fromId  (orange)
 *   'bidirectional' → both ends               (green)
 *
 * @param {object} cfg
 * @returns {object} ConnectionElement
 */
export function createConnection(cfg) {
  return {
    id:        cfg.id,
    type:      'connection',
    className: 'connection',
    x:         0,   // connections are position-less; resolved via fromId/toId
    y:         0,
    fromId:    cfg.fromId,
    toId:      cfg.toId,
    direction: cfg.direction ?? 'from',
    lineCount: cfg.lineCount ?? 1,
    style:     {},
    state:     makeState({ zIndex: 1 }),
    meta:      cfg.meta ?? {},
  };
}
