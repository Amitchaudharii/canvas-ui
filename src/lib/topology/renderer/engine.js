// ============================================================
//  TOPOLOGY ENGINE
//  Framework-agnostic orchestrator. Zero React dependencies.
//  React hooks and window.TopologyAPI share the ENGINE singleton.
//
//  Connection model:
//    loadConfig explodes each ConnectionConfig into N individual
//    ConnectionLine elements (one per line).
//    Every line is independently registered in the registry,
//    independently hit-testable, and independently styleable.
// ============================================================

import { ElementRegistry } from "../registry.js";
import { ViewportManager } from "./viewport.js";
import {
  createRouter,
  createBridge,
  createConnectionLines,
} from "../factory.js";
import { computeBBox } from "../layout.js";
import {
  drawGrid,
  drawElement,
  hitTestRouter,
  hitTestBridge,
  hitTestConnectionLine,
} from "./draw.js";

export class TopologyEngine {
  constructor() {
    this.registry = new ElementRegistry();
    this.viewport = new ViewportManager();
    this._canvas = null;
    this._ctx = null;
    this._raf = null;
    this._dirty = true;
    this._selected = null;
    this._hovered = null;
    this._positions = new Map(); // id → { x, y, radius? }
    this._drawOrder = []; // connections-lines → bridges → routers
    this._listeners = new Map();
  }

  // ── Lifecycle ─────────────────────────────────────────────

  mount(canvas) {
    this._canvas = canvas;
    this._ctx = canvas.getContext("2d");
    this.viewport.setSize(canvas.width, canvas.height);
    this._loop();
  }

  unmount() {
    if (this._raf !== null) cancelAnimationFrame(this._raf);
    this._raf = null;
    this._canvas = null;
    this._ctx = null;
  }

  resize(w, h) {
    if (!this._canvas) return;
    this._canvas.width = w;
    this._canvas.height = h;
    this.viewport.setSize(w, h);
    this._dirty = true;
  }

  // ── Config ────────────────────────────────────────────────

  loadConfig(config) {
    this.registry.clear();
    this._positions.clear();
    this._drawOrder = [];
    this._selected = null;
    this._hovered = null;

    const lines = []; // all individual ConnectionLine elements

    for (const r of config.routers ?? []) {
      const el = createRouter(r);
      this.registry.register(el);
      this._positions.set(el.id, { x: el.x, y: el.y, radius: el.radius });
    }

    for (const b of config.bridges ?? []) {
      const el = createBridge(b);
      this.registry.register(el);
      this._positions.set(el.id, { x: el.x, y: el.y, radius: el.radius });
    }

    for (const c of config.connections ?? []) {
      // Explode into individual lines — each gets its own registry entry
      const lineEls = createConnectionLines(c);
      for (const line of lineEls) {
        this.registry.register(line);
        lines.push(line);
      }
    }

    // Draw order: connection-lines (back) → bridges → routers (front)
    this._drawOrder = [
      ...lines,
      ...this.registry.getByType("bridge").elements,
      ...this.registry.getByType("router").elements,
    ];

    this._fitToContent();
    this._emit("loaded", { count: this.registry.size });
    this._dirty = true;
  }

  // ── Public API ────────────────────────────────────────────

  markDirty() {
    this._dirty = true;
  }

  selectById(id) {
    const el = this.registry.getElementById(id);
    this._applySelect(el);
    return el;
  }

  clearSelection() {
    this._applySelect(null);
  }
  fitToScreen(p = 80) {
    this._fitToContent(p);
  }
  zoomIn() {
    this.viewport.zoomAt(1.2);
    this._emitVp();
    this._dirty = true;
  }
  zoomOut() {
    this.viewport.zoomAt(0.83);
    this._emitVp();
    this._dirty = true;
  }
  resetView() {
    this.viewport.reset();
    this._emitVp();
    this._dirty = true;
  }

  // ── Interaction handlers ──────────────────────────────────

  onWheel(e) {
    e.preventDefault();
    this.viewport.zoomAt(e.deltaY < 0 ? 1.1 : 0.9, e.clientX, e.clientY);
    this._emitVp();
    this._dirty = true;
  }

  onMouseDown(e) {
    return { dragging: e.button === 0, origin: { x: e.clientX, y: e.clientY } };
  }

  onMouseMove(e, dragging, origin) {
    if (dragging) {
      this.viewport.pan(e.clientX - origin.x, e.clientY - origin.y);
      this._emitVp();
      this._dirty = true;
      return { x: e.clientX, y: e.clientY };
    }
    const w = this.viewport.toWorld(e.clientX, e.clientY);
    const hit = this._hitTest(w.x, w.y);
    if (hit !== this._hovered) {
      if (this._hovered) this._hovered.state.hovered = false;
      this._hovered = hit;
      if (hit) hit.state.hovered = true;
      this._emit("hover", { element: hit });
      this._dirty = true;
    }
    return origin;
  }

  onMouseUp(e, wasDragging, dragMoved) {
    if (!wasDragging || dragMoved) return;
    const w = this.viewport.toWorld(e.clientX, e.clientY);
    const hit = this._hitTest(w.x, w.y);
    this._applySelect(hit);
  }

  // ── Event bus ─────────────────────────────────────────────

  on(event, handler) {
    if (!this._listeners.has(event)) this._listeners.set(event, new Set());
    this._listeners.get(event).add(handler);
    return () => this._listeners.get(event)?.delete(handler);
  }

  // ── Private: render loop ──────────────────────────────────

  _loop() {
    if (this._dirty && this._ctx && this._canvas) {
      this._render(this._ctx, this._canvas);
      this._dirty = false;
    }
    this._raf = requestAnimationFrame(() => this._loop());
  }

  _render(ctx, canvas) {
    const W = canvas.width,
      H = canvas.height;
    ctx.fillStyle = "#0d1b2a";
    ctx.fillRect(0, 0, W, H);
    drawGrid(
      ctx,
      W,
      H,
      this.viewport.panX,
      this.viewport.panY,
      this.viewport.zoom,
    );
    ctx.save();
    this.viewport.apply(ctx);
    for (const el of this._drawOrder) drawElement(ctx, el, this._positions);
    ctx.restore();
  }

  // ── Private: hit testing ──────────────────────────────────

  _hitTest(wx, wy) {
    for (let i = this._drawOrder.length - 1; i >= 0; i--) {
      const el = this._drawOrder[i];
      if (!el.state.visible || el.state.disabled) continue;
      if (this._hitOne(el, wx, wy)) return el;
    }
    return null;
  }

  _hitOne(el, wx, wy) {
    if (el.type === "router") return hitTestRouter(el, wx, wy);
    if (el.type === "bridge") return hitTestBridge(el, wx, wy);
    if (el.type === "connection-line") {
      const from = this._positions.get(el.fromId);
      const to = this._positions.get(el.toId);
      if (!from || !to) return false;
      // Threshold = half the rendered line width + 2px finger tolerance
      const lw = el.style?.strokeWidth ?? 1;
      const threshold = lw / 2 + 2;
      return hitTestConnectionLine(from, to, el.offset, wx, wy, threshold);
    }
    return false;
  }

  // ── Private: selection ────────────────────────────────────

  _applySelect(el) {
    const previous = this._selected;
    if (previous) previous.state.selected = false;
    this._selected = el;
    if (el) el.state.selected = true;
    this._emit("select", { element: el, previous });
    this._dirty = true;
  }

  // ── Private: fit / emit ───────────────────────────────────

  _fitToContent(padding = 80) {
    const pts = [...this._positions.values()];
    if (!pts.length) return;
    if (this._canvas)
      this.viewport.setSize(this._canvas.width, this._canvas.height);
    this.viewport.fitToBBox(computeBBox(pts), padding);
    this._emitVp();
    this._dirty = true;
  }

  _emitVp() {
    this._emit("viewport", {
      zoom: this.viewport.zoom,
      panX: this.viewport.panX,
      panY: this.viewport.panY,
    });
  }

  _emit(event, payload) {
    this._listeners.get(event)?.forEach((h) => h(payload));
  }
}

export const ENGINE = new TopologyEngine();
