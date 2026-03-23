// ============================================================
//  CANVAS DRAW FUNCTIONS
//  Pure, stateless. One function per element type.
//  No class instances, no side effects — easy to test/replace.
//
//  Arrow direction:
//    'from'          → arrowhead toward toId    (blue  #64c8ff)
//    'to'            → arrowhead toward fromId   (orange #ff8c42)
//    'bidirectional' → arrowheads on both ends   (green  #aaffcc)
// ============================================================

// ── Design tokens ─────────────────────────────────────────────

const TOKEN = {
  bg:           '#0d1b2a',
  routerFill:   '#0a1520',
  routerStroke: '#ffffff',
  routerLabel:  '#ffffff',
  bridgeFill:   '#111a24',
  bridgeStroke: '#bbbbbb',
  bridgeLabel:  '#dddddd',
  connStroke:   '#ffffff',
  selStroke:    '#64c8ff',
  selFill:      '#0d2a3e',
  hovStroke:    '#90d8ff',
  glowSel:      '#64c8ff',
  glowHov:      '#90d8ff',
  arrowFrom:    '#64c8ff',   // direction = 'from'
  arrowTo:      '#ff8c42',   // direction = 'to'
  arrowBi:      '#aaffcc',   // direction = 'bidirectional'
  font:         "'Courier New', monospace",
};

// ── Helpers ───────────────────────────────────────────────────

/**
 * Resolve a style property with a fallback.
 * @param {object} style
 * @param {string} key
 * @param {*} fallback
 */
function rs(style, key, fallback) {
  return style[key] ?? fallback;
}

/**
 * Draw an octagon path (8 sides, flat-top orientation).
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} cx
 * @param {number} cy
 * @param {number} r  radius
 */
function octagonPath(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a  = (Math.PI * 2 * i) / 8 + Math.PI / 8;
    const px = cx + r * Math.cos(a);
    const py = cy + r * Math.sin(a);
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function setGlow(ctx, color, blur) {
  ctx.shadowColor = color;
  ctx.shadowBlur  = blur;
}

function clearGlow(ctx) {
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur  = 0;
}

// ── Router ────────────────────────────────────────────────────

/**
 * Draw a router as a double-ring octagon.
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} el  RouterElement
 */
export function drawRouter(ctx, el) {
  if (!el.state.visible) return;

  const { x, y, radius: r, label, style, state } = el;
  const sel = state.selected;
  const hov = state.hovered;

  const fill   = rs(style, 'fillColor',   sel ? TOKEN.selFill   : TOKEN.routerFill);
  const stroke = rs(style, 'strokeColor', sel ? TOKEN.selStroke : hov ? TOKEN.hovStroke : TOKEN.routerStroke);
  const sw     = rs(style, 'strokeWidth', sel ? 3 : 2);
  const lc     = rs(style, 'labelColor',  TOKEN.routerLabel);
  const fs     = rs(style, 'fontSize',    13);

  ctx.save();

  if (sel || hov) {
    setGlow(
      ctx,
      rs(style, 'glowColor', sel ? TOKEN.glowSel : TOKEN.glowHov),
      rs(style, 'glowBlur',  sel ? 28 : 16),
    );
  }

  // Outer octagon
  octagonPath(ctx, x, y, r);
  ctx.fillStyle   = fill;   ctx.fill();
  ctx.strokeStyle = stroke; ctx.lineWidth = sw; ctx.stroke();
  clearGlow(ctx);

  // Inner ring (double-octagon aesthetic)
  octagonPath(ctx, x, y, r - 6);
  ctx.strokeStyle = stroke + '44';
  ctx.lineWidth   = 1;
  ctx.stroke();

  // Label
  ctx.fillStyle    = lc;
  ctx.font         = `bold ${fs}px ${TOKEN.font}`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x, y);

  ctx.restore();
}

// ── Bridge ────────────────────────────────────────────────────

/**
 * Draw a bridge as a rounded rectangle.
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} el  BridgeElement
 */
export function drawBridge(ctx, el) {
  if (!el.state.visible) return;

  const { x, y, radius: r, label, style, state } = el;
  const sel = state.selected;
  const hov = state.hovered;

  const fill   = rs(style, 'fillColor',   sel ? TOKEN.selFill   : TOKEN.bridgeFill);
  const stroke = rs(style, 'strokeColor', sel ? TOKEN.selStroke : hov ? TOKEN.hovStroke : TOKEN.bridgeStroke);
  const sw     = rs(style, 'strokeWidth', sel ? 2.5 : 1.5);
  const lc     = rs(style, 'labelColor',  TOKEN.bridgeLabel);
  const fs     = rs(style, 'fontSize',    10);

  ctx.save();

  if (sel || hov) {
    setGlow(ctx, sel ? TOKEN.glowSel : TOKEN.glowHov, sel ? 20 : 12);
  }

  const hw = r, hh = r * 0.72;
  ctx.beginPath();
  ctx.roundRect(x - hw, y - hh, hw * 2, hh * 2, 4);
  ctx.fillStyle   = fill;   ctx.fill();
  ctx.strokeStyle = stroke; ctx.lineWidth = sw; ctx.stroke();
  clearGlow(ctx);

  ctx.fillStyle    = lc;
  ctx.font         = `bold ${fs}px ${TOKEN.font}`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x, y);

  ctx.restore();
}

// ── Connection ────────────────────────────────────────────────

/**
 * Draw a connection as a multi-line bundle with directional arrowheads.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} el       ConnectionElement
 * @param {{ x, y, radius? }} from  position of the source element
 * @param {{ x, y, radius? }} to    position of the target element
 */
export function drawConnection(ctx, el, from, to) {
  if (!el.state.visible) return;

  const { style, state, direction, lineCount } = el;
  const sel = state.selected;
  const hov = state.hovered;

  const x1 = from.x, y1 = from.y;
  const x2 = to.x,   y2 = to.y;
  const dx  = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;

  // Perpendicular normal for multi-line offset
  const nx = -dy / len, ny = dx / len;

  // Arrow color is driven entirely by direction
  const dirColor = direction === 'from' ? TOKEN.arrowFrom
                 : direction === 'to'   ? TOKEN.arrowTo
                 :                        TOKEN.arrowBi;

  const stroke  = rs(style, 'strokeColor', sel ? TOKEN.selStroke : hov ? TOKEN.hovStroke : TOKEN.connStroke);
  const alpha   = rs(style, 'alpha',       sel ? 0.95 : hov ? 0.82 : 0.5);
  const lw      = rs(style, 'strokeWidth', 1);
  const spacing = rs(style, 'lineSpacing', 3.5);
  const dash    = style.dash ?? [];

  const count    = Math.max(1, lineCount);
  const startOff = -(count - 1) / 2 * spacing;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = stroke;
  ctx.lineWidth   = lw;
  if (dash.length) ctx.setLineDash(dash);

  // ── Multi-line bundle ─────────────────────────────────────
  for (let i = 0; i < count; i++) {
    const off = startOff + i * spacing;
    ctx.beginPath();
    ctx.moveTo(x1 + nx * off, y1 + ny * off);
    ctx.lineTo(x2 + nx * off, y2 + ny * off);
    ctx.stroke();
  }

  ctx.setLineDash([]);
  ctx.globalAlpha = Math.min(1, alpha + 0.28);
  ctx.fillStyle   = dirColor;

  const angle  = Math.atan2(dy, dx);
  const AL = 11, AW = Math.PI / 6;
  const toR   = to.radius   ?? 18;
  const fromR = from.radius ?? 46;

  // ── Arrowhead → toward toId (direction = 'from' or 'bidirectional') ──
  if (direction === 'from' || direction === 'bidirectional') {
    const tip = {
      x: x2 - (dx / len) * (toR + 1),
      y: y2 - (dy / len) * (toR + 1),
    };
    ctx.beginPath();
    ctx.moveTo(tip.x, tip.y);
    ctx.lineTo(tip.x - AL * Math.cos(angle - AW), tip.y - AL * Math.sin(angle - AW));
    ctx.lineTo(tip.x - AL * Math.cos(angle + AW), tip.y - AL * Math.sin(angle + AW));
    ctx.closePath();
    ctx.fill();
  }

  // ── Arrowhead ← toward fromId (direction = 'to' or 'bidirectional') ──
  if (direction === 'to' || direction === 'bidirectional') {
    const ra  = angle + Math.PI;
    const tip = {
      x: x1 + (dx / len) * (fromR + 1),
      y: y1 + (dy / len) * (fromR + 1),
    };
    ctx.beginPath();
    ctx.moveTo(tip.x, tip.y);
    ctx.lineTo(tip.x - AL * Math.cos(ra - AW), tip.y - AL * Math.sin(ra - AW));
    ctx.lineTo(tip.x - AL * Math.cos(ra + AW), tip.y - AL * Math.sin(ra + AW));
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

// ── Grid ──────────────────────────────────────────────────────

/**
 * Draw a subtle dot-grid background aligned to the viewport.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} width
 * @param {number} height
 * @param {number} panX
 * @param {number} panY
 * @param {number} zoom
 */
export function drawGrid(ctx, width, height, panX, panY, zoom) {
  const gs = 60 * zoom;
  if (gs < 8) return;

  const ox = ((panX % gs) + gs) % gs;
  const oy = ((panY % gs) + gs) % gs;

  ctx.save();
  ctx.strokeStyle = 'rgba(100, 200, 255, 0.04)';
  ctx.lineWidth   = 1;

  for (let x = ox; x < width;  x += gs) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
  }
  for (let y = oy; y < height; y += gs) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y);  ctx.stroke();
  }
  ctx.restore();
}

// ── Hit testing ───────────────────────────────────────────────

/**
 * @param {object} el  RouterElement
 * @param {number} wx  world x
 * @param {number} wy  world y
 * @returns {boolean}
 */
export function hitTestRouter(el, wx, wy) {
  const dx = wx - el.x, dy = wy - el.y;
  return Math.sqrt(dx * dx + dy * dy) < el.radius + 4;
}

/**
 * @param {object} el  BridgeElement
 * @param {number} wx
 * @param {number} wy
 * @returns {boolean}
 */
export function hitTestBridge(el, wx, wy) {
  const hw = el.radius, hh = el.radius * 0.72;
  return wx >= el.x - hw - 4 && wx <= el.x + hw + 4
      && wy >= el.y - hh - 4 && wy <= el.y + hh + 4;
}

/**
 * Line-segment distance hit test for connections.
 * @param {{ x, y }} fromPos
 * @param {{ x, y }} toPos
 * @param {number} wx
 * @param {number} wy
 * @param {number} threshold  px tolerance
 * @returns {boolean}
 */
export function hitTestConnection(fromPos, toPos, wx, wy, threshold = 8) {
  const dx   = toPos.x - fromPos.x, dy = toPos.y - fromPos.y;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return false;
  const t  = Math.max(0, Math.min(1, ((wx - fromPos.x) * dx + (wy - fromPos.y) * dy) / len2));
  const cx = fromPos.x + t * dx - wx;
  const cy = fromPos.y + t * dy - wy;
  return Math.sqrt(cx * cx + cy * cy) < threshold;
}

// ── Dispatch ─────────────────────────────────────────────────

/**
 * Draw any element, dispatching by type.
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} el
 * @param {Map<string, {x,y,radius?}>} positions
 */
export function drawElement(ctx, el, positions) {
  switch (el.type) {
    case 'router':
      drawRouter(ctx, el);
      break;
    case 'bridge':
      drawBridge(ctx, el);
      break;
    case 'connection': {
      const from = positions.get(el.fromId);
      const to   = positions.get(el.toId);
      if (from && to) drawConnection(ctx, el, from, to);
      break;
    }
  }
}
