// ============================================================
//  CANVAS DRAW FUNCTIONS
//  Pure, stateless. One function per element type.
//
//  Connection model:
//    drawConnectionLine(ctx, el, from, to)
//      — draws ONE line with its own arrowhead(s).
//      — arrowhead color/size matches the line's resolved style.
//      — el.offset is the perpendicular displacement from centre.
//
//  Arrow direction:
//    'from'          → arrowhead toward toId    (blue  #64c8ff)
//    'to'            → arrowhead toward fromId   (orange #ff8c42)
//    'bidirectional' → arrowheads on both ends   (green  #aaffcc)
// ============================================================

const TOKEN = {
  bg: "#0d1b2a",
  routerFill: "#0a1520",
  routerStroke: "#ffffff",
  routerLabel: "#ffffff",
  bridgeFill: "#111a24",
  bridgeStroke: "#bbbbbb",
  bridgeLabel: "#dddddd",
  connStroke: "#ffffff",
  selStroke: "#64c8ff",
  selFill: "#0d2a3e",
  hovStroke: "#90d8ff",
  glowSel: "#64c8ff",
  glowHov: "#90d8ff",
  arrowFrom: "#64c8ff",
  arrowTo: "#ff8c42",
  arrowBi: "#aaffcc",
  font: "'Courier New', monospace",
};

// ── Helpers ───────────────────────────────────────────────────

function rs(style, key, fallback) {
  return style[key] ?? fallback;
}

function octagonPath(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI * 2 * i) / 8 + Math.PI / 8;
    i === 0
      ? ctx.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a))
      : ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
  }
  ctx.closePath();
}

function setGlow(ctx, color, blur) {
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
}
function clearGlow(ctx) {
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
}

// ── Router ────────────────────────────────────────────────────

export function drawRouter(ctx, el) {
  if (!el.state.visible) return;
  const { x, y, radius: r, label, style, state } = el;
  const sel = state.selected,
    hov = state.hovered;

  const fill = rs(style, "fillColor", sel ? TOKEN.selFill : TOKEN.routerFill);
  const stroke = rs(
    style,
    "strokeColor",
    sel ? TOKEN.selStroke : hov ? TOKEN.hovStroke : TOKEN.routerStroke,
  );
  const sw = rs(style, "strokeWidth", sel ? 3 : 2);
  const lc = rs(style, "labelColor", TOKEN.routerLabel);
  const fs = rs(style, "fontSize", 13);

  ctx.save();
  if (sel || hov)
    setGlow(
      ctx,
      rs(style, "glowColor", sel ? TOKEN.glowSel : TOKEN.glowHov),
      rs(style, "glowBlur", sel ? 28 : 16),
    );

  octagonPath(ctx, x, y, r);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = sw;
  ctx.stroke();
  clearGlow(ctx);

  octagonPath(ctx, x, y, r - 6);
  ctx.strokeStyle = stroke + "44";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = lc;
  ctx.font = `bold ${fs}px ${TOKEN.font}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x, y);
  ctx.restore();
}

// ── Bridge ────────────────────────────────────────────────────

export function drawBridge(ctx, el) {
  if (!el.state.visible) return;
  const { x, y, radius: r, label, style, state } = el;
  const sel = state.selected,
    hov = state.hovered;

  const fill = rs(style, "fillColor", sel ? TOKEN.selFill : TOKEN.bridgeFill);
  const stroke = rs(
    style,
    "strokeColor",
    sel ? TOKEN.selStroke : hov ? TOKEN.hovStroke : TOKEN.bridgeStroke,
  );
  const sw = rs(style, "strokeWidth", sel ? 2.5 : 1.5);
  const lc = rs(style, "labelColor", TOKEN.bridgeLabel);
  const fs = rs(style, "fontSize", 10);

  ctx.save();
  if (sel || hov)
    setGlow(ctx, sel ? TOKEN.glowSel : TOKEN.glowHov, sel ? 20 : 12);

  const hw = r,
    hh = r * 0.72;
  ctx.beginPath();
  ctx.roundRect(x - hw, y - hh, hw * 2, hh * 2, 4);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = sw;
  ctx.stroke();
  clearGlow(ctx);

  ctx.fillStyle = lc;
  ctx.font = `bold ${fs}px ${TOKEN.font}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x, y);
  ctx.restore();
}

// ── Connection Line ───────────────────────────────────────────
//
//  One independently drawn line. el.offset displaces it
//  perpendicularly from the centre axis so bundles spread out.
//  The arrowhead is drawn with the SAME color and width as the
//  line — they are visually one object.

export function drawConnectionLine(ctx, el, from, to) {
  if (!el.state.visible) return;

  const { style, state, direction, offset } = el;
  const sel = state.selected,
    hov = state.hovered;

  const x1 = from.x,
    y1 = from.y;
  const x2 = to.x,
    y2 = to.y;
  const dx = x2 - x1,
    dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;

  // Perpendicular unit normal
  const nx = -dy / len,
    ny = dx / len;

  // Apply this line's offset from the bundle centre
  const sx = x1 + nx * offset,
    sy = y1 + ny * offset;
  const ex = x2 + nx * offset,
    ey = y2 + ny * offset;

  // Direction drives the base color of BOTH line and arrowhead
  const dirColor =
    direction === "from"
      ? TOKEN.arrowFrom
      : direction === "to"
        ? TOKEN.arrowTo
        : TOKEN.arrowBi;

  // Resolved line style — selected/hovered override color
  const stroke = rs(
    style,
    "strokeColor",
    sel ? TOKEN.selStroke : hov ? TOKEN.hovStroke : dirColor,
  );
  const alpha = rs(style, "alpha", sel ? 0.95 : hov ? 0.85 : 0.55);
  const lw = rs(style, "strokeWidth", sel ? 2 : 1);
  const dash = style.dash ?? [];

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lw;
  if (dash.length) ctx.setLineDash(dash);

  // ── Draw the line ─────────────────────────────────────────
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(ex, ey);
  ctx.stroke();
  ctx.setLineDash([]);

  // ── Draw arrowhead(s) — same color & alpha as the line ────
  //    Size scales with lineWidth so thin lines get thin arrows.
  ctx.globalAlpha = Math.min(1, alpha + 0.2);
  ctx.fillStyle = stroke; // ← arrowhead matches line color exactly

  const angle = Math.atan2(dy, dx);
  const AL = rs(style, "arrowLength", 1 + lw * 2); // scales tightly with line width
  const AW = rs(style, "arrowWidth", Math.PI / 7); // narrower angle → slimmer head
  const toR = to.radius ?? 18;
  const fromR = from.radius ?? 46;

  // Arrow → toward toId   (direction = 'from' | 'bidirectional')
  if (direction === "from" || direction === "bidirectional") {
    // tip sits on the element edge, offset laterally with the line
    const tipX = x2 - (dx / len) * (toR + 1) + nx * offset;
    const tipY = y2 - (dy / len) * (toR + 1) + ny * offset;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(
      tipX - AL * Math.cos(angle - AW),
      tipY - AL * Math.sin(angle - AW),
    );
    ctx.lineTo(
      tipX - AL * Math.cos(angle + AW),
      tipY - AL * Math.sin(angle + AW),
    );
    ctx.closePath();
    ctx.fill();
  }

  // Arrow ← toward fromId  (direction = 'to' | 'bidirectional')
  if (direction === "to" || direction === "bidirectional") {
    const ra = angle + Math.PI;
    const tipX = x1 + (dx / len) * (fromR + 1) + nx * offset;
    const tipY = y1 + (dy / len) * (fromR + 1) + ny * offset;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(tipX - AL * Math.cos(ra - AW), tipY - AL * Math.sin(ra - AW));
    ctx.lineTo(tipX - AL * Math.cos(ra + AW), tipY - AL * Math.sin(ra + AW));
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

// ── Grid ──────────────────────────────────────────────────────

export function drawGrid(ctx, width, height, panX, panY, zoom) {
  const gs = 60 * zoom;
  if (gs < 8) return;
  const ox = ((panX % gs) + gs) % gs;
  const oy = ((panY % gs) + gs) % gs;
  ctx.save();
  ctx.strokeStyle = "rgba(100, 200, 255, 0.04)";
  ctx.lineWidth = 1;
  for (let x = ox; x < width; x += gs) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = oy; y < height; y += gs) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  ctx.restore();
}

// ── Hit testing ───────────────────────────────────────────────

export function hitTestRouter(el, wx, wy) {
  const dx = wx - el.x,
    dy = wy - el.y;
  return Math.sqrt(dx * dx + dy * dy) < el.radius + 4;
}

export function hitTestBridge(el, wx, wy) {
  const hw = el.radius,
    hh = el.radius * 0.72;
  return (
    wx >= el.x - hw - 4 &&
    wx <= el.x + hw + 4 &&
    wy >= el.y - hh - 4 &&
    wy <= el.y + hh + 4
  );
}

/**
 * Hit test a single connection line using its offset.
 * @param {{ x, y, radius? }} fromPos
 * @param {{ x, y, radius? }} toPos
 * @param {number} offset   perpendicular displacement of this line
 * @param {number} wx
 * @param {number} wy
 * @param {number} threshold
 */
export function hitTestConnectionLine(
  fromPos,
  toPos,
  offset,
  wx,
  wy,
  threshold,
) {
  const dx = toPos.x - fromPos.x,
    dy = toPos.y - fromPos.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;

  // Offset start/end points laterally
  const nx = -dy / len,
    ny = dx / len;
  const sx = fromPos.x + nx * offset,
    sy = fromPos.y + ny * offset;
  const ex = toPos.x + nx * offset,
    ey = toPos.y + ny * offset;

  const ldx = ex - sx,
    ldy = ey - sy;
  const len2 = ldx * ldx + ldy * ldy;
  if (len2 === 0) return false;

  const t = Math.max(
    0,
    Math.min(1, ((wx - sx) * ldx + (wy - sy) * ldy) / len2),
  );
  const cx = sx + t * ldx - wx;
  const cy = sy + t * ldy - wy;
  return Math.sqrt(cx * cx + cy * cy) < threshold;
}

// ── Dispatch ─────────────────────────────────────────────────

export function drawElement(ctx, el, positions) {
  switch (el.type) {
    case "router":
      drawRouter(ctx, el);
      break;
    case "bridge":
      drawBridge(ctx, el);
      break;
    case "connection-line": {
      const from = positions.get(el.fromId);
      const to = positions.get(el.toId);
      if (from && to) drawConnectionLine(ctx, el, from, to);
      break;
    }
  }
}
