// ============================================================
//  TOPOLOGY ENGINE
//  Framework-agnostic orchestrator. Zero React dependencies.
//  React hooks, vanilla JS, and window.TopologyAPI all share
//  the ENGINE singleton exported at the bottom of this file.
//
//  Responsibilities:
//    - Registry management
//    - rAF render loop with dirty flag (perf: only redraws on change)
//    - Hit testing (click, hover) — reverse draw-order, O(n)
//    - Selection and hover state
//    - Event bus: on('select'|'hover'|'loaded'|'viewport', handler)
//    - Interaction handlers called by the event wiring layer
// ============================================================

import { ElementRegistry } from '../registry.js';
import { ViewportManager }  from './viewport.js';
import { createRouter, createBridge, createConnection } from '../factory.js';
import { computeBBox } from '../layout.js';
import {
  drawGrid, drawElement,
  hitTestRouter, hitTestBridge, hitTestConnection,
} from './draw.js';

export class TopologyEngine {
  constructor() {
    this.registry   = new ElementRegistry();
    this.viewport   = new ViewportManager();

    /** @type {HTMLCanvasElement|null} */
    this._canvas    = null;
    /** @type {CanvasRenderingContext2D|null} */
    this._ctx       = null;
    /** @type {number|null} */
    this._raf       = null;
    this._dirty     = true;

    /** @type {object|null} currently selected element */
    this._selected  = null;
    /** @type {object|null} currently hovered element */
    this._hovered   = null;

    /**
     * Position cache — updated on loadConfig.
     * Used every render frame to resolve connection endpoints.
     * @type {Map<string, {x:number, y:number, radius?:number}>}
     */
    this._positions = new Map();

    /**
     * Pre-sorted draw list: connections → bridges → routers.
     * @type {object[]}
     */
    this._drawOrder = [];

    /**
     * Event listener sets keyed by event name.
     * @type {Map<string, Set<Function>>}
     */
    this._listeners = new Map();
  }

  // ── Lifecycle ─────────────────────────────────────────────

  /**
   * Attach the engine to a canvas element and start the render loop.
   * @param {HTMLCanvasElement} canvas
   */
  mount(canvas) {
    this._canvas = canvas;
    this._ctx    = canvas.getContext('2d');
    this.viewport.setSize(canvas.width, canvas.height);
    this._loop();
  }

  /** Stop the render loop and release the canvas. */
  unmount() {
    if (this._raf !== null) cancelAnimationFrame(this._raf);
    this._raf    = null;
    this._canvas = null;
    this._ctx    = null;
  }

  /**
   * Update canvas size after a resize event.
   * @param {number} w
   * @param {number} h
   */
  resize(w, h) {
    if (!this._canvas) return;
    this._canvas.width  = w;
    this._canvas.height = h;
    this.viewport.setSize(w, h);
    this._dirty = true;
  }

  // ── Config ────────────────────────────────────────────────

  /**
   * Load a topology config from the backend.
   * Clears all existing elements and rebuilds.
   *
   * @param {{ routers: object[], bridges: object[], connections: object[] }} config
   */
  loadConfig(config) {
    this.registry.clear();
    this._positions.clear();
    this._drawOrder  = [];
    this._selected   = null;
    this._hovered    = null;

    const conns = [];

    for (const r of (config.routers ?? [])) {
      const el = createRouter(r);
      this.registry.register(el);
      this._positions.set(el.id, { x: el.x, y: el.y, radius: el.radius });
    }

    for (const b of (config.bridges ?? [])) {
      const el = createBridge(b);
      this.registry.register(el);
      this._positions.set(el.id, { x: el.x, y: el.y, radius: el.radius });
    }

    for (const c of (config.connections ?? [])) {
      const el = createConnection(c);
      this.registry.register(el);
      conns.push(el);
    }

    // Render back-to-front: connections → bridges → routers
    this._drawOrder = [
      ...conns,
      ...this.registry.getByType('bridge').elements,
      ...this.registry.getByType('router').elements,
    ];

    this._fitToContent();
    this._emit('loaded', { count: this.registry.size });
    this._dirty = true;
  }

  // ── Public API ────────────────────────────────────────────

  /** Trigger a repaint. Call after any programmatic style change. */
  markDirty() { this._dirty = true; }

  /**
   * Select an element by id.
   * @param {string} id
   * @returns {object|null}
   */
  selectById(id) {
    const el = this.registry.getElementById(id);
    this._applySelect(el);
    return el;
  }

  /** Deselect the current element. */
  clearSelection() { this._applySelect(null); }

  /**
   * Fit all elements into the viewport.
   * @param {number} [padding=80]
   */
  fitToScreen(padding = 80) { this._fitToContent(padding); }

  zoomIn()    { this.viewport.zoomAt(1.2);  this._emitVp(); this._dirty = true; }
  zoomOut()   { this.viewport.zoomAt(0.83); this._emitVp(); this._dirty = true; }
  resetView() { this.viewport.reset();      this._emitVp(); this._dirty = true; }

  // ── Interaction handlers (called from event-wiring layer) ─

  /** @param {WheelEvent} e */
  onWheel(e) {
    e.preventDefault();
    this.viewport.zoomAt(e.deltaY < 0 ? 1.1 : 0.9, e.clientX, e.clientY);
    this._emitVp();
    this._dirty = true;
  }

  /**
   * @param {MouseEvent} e
   * @returns {{ dragging: boolean, origin: {x,y} }}
   */
  onMouseDown(e) {
    return { dragging: e.button === 0, origin: { x: e.clientX, y: e.clientY } };
  }

  /**
   * Handle mouse move — pan if dragging, otherwise update hover.
   * @param {MouseEvent} e
   * @param {boolean} dragging
   * @param {{ x, y }} origin
   * @returns {{ x, y }}  new origin
   */
  onMouseMove(e, dragging, origin) {
    if (dragging) {
      this.viewport.pan(e.clientX - origin.x, e.clientY - origin.y);
      this._emitVp();
      this._dirty = true;
      return { x: e.clientX, y: e.clientY };
    }

    const w   = this.viewport.toWorld(e.clientX, e.clientY);
    const hit = this._hitTest(w.x, w.y);

    if (hit !== this._hovered) {
      if (this._hovered) this._hovered.state.hovered = false;
      this._hovered = hit;
      if (hit) hit.state.hovered = true;
      this._emit('hover', { element: hit });
      this._dirty = true;
    }
    return origin;
  }

  /**
   * Handle mouse up — fire selection if click (not drag).
   * @param {MouseEvent} e
   * @param {boolean} wasDragging
   * @param {boolean} dragMoved
   */
  onMouseUp(e, wasDragging, dragMoved) {
    if (!wasDragging || dragMoved) return;
    const w   = this.viewport.toWorld(e.clientX, e.clientY);
    const hit = this._hitTest(w.x, w.y);
    this._applySelect(hit);
  }

  // ── Event bus ─────────────────────────────────────────────

  /**
   * Subscribe to an engine event.
   * @param {'select'|'hover'|'loaded'|'viewport'} event
   * @param {Function} handler
   * @returns {Function}  unsubscribe function
   */
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
    const W = canvas.width, H = canvas.height;

    ctx.fillStyle = '#0d1b2a';
    ctx.fillRect(0, 0, W, H);

    drawGrid(ctx, W, H, this.viewport.panX, this.viewport.panY, this.viewport.zoom);

    ctx.save();
    this.viewport.apply(ctx);
    for (const el of this._drawOrder) drawElement(ctx, el, this._positions);
    ctx.restore();
  }

  // ── Private: hit testing ──────────────────────────────────

  _hitTest(wx, wy) {
    // Reverse draw order → topmost element wins
    for (let i = this._drawOrder.length - 1; i >= 0; i--) {
      const el = this._drawOrder[i];
      if (!el.state.visible || el.state.disabled) continue;
      if (this._hitOne(el, wx, wy)) return el;
    }
    return null;
  }

  _hitOne(el, wx, wy) {
    if (el.type === 'router')     return hitTestRouter(el, wx, wy);
    if (el.type === 'bridge')     return hitTestBridge(el, wx, wy);
    if (el.type === 'connection') {
      const from = this._positions.get(el.fromId);
      const to   = this._positions.get(el.toId);
      return from && to ? hitTestConnection(from, to, wx, wy) : false;
    }
    return false;
  }

  // ── Private: selection ────────────────────────────────────

  _applySelect(el) {
    const previous = this._selected;
    if (previous) previous.state.selected = false;
    this._selected = el;
    if (el) el.state.selected = true;
    this._emit('select', { element: el, previous });
    this._dirty = true;
  }

  // ── Private: fit / emit ───────────────────────────────────

  _fitToContent(padding = 80) {
    const pts = [...this._positions.values()];
    if (!pts.length) return;
    if (this._canvas) this.viewport.setSize(this._canvas.width, this._canvas.height);
    this.viewport.fitToBBox(computeBBox(pts), padding);
    this._emitVp();
    this._dirty = true;
  }

  _emitVp() {
    this._emit('viewport', {
      zoom: this.viewport.zoom,
      panX: this.viewport.panX,
      panY: this.viewport.panY,
    });
  }

  _emit(event, payload) {
    this._listeners.get(event)?.forEach(h => h(payload));
  }
}

// ── Singleton ─────────────────────────────────────────────────
// One engine per app.
// useTopology hook, TopologyPage, and window.TopologyAPI all share this.
export const ENGINE = new TopologyEngine();
