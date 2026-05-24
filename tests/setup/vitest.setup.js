// ============================================================
//  VITEST SETUP
//  Provides browser-API polyfills so the engine, registry,
//  viewport, and draw modules can be tested in Node.js.
// ============================================================

import { vi } from 'vitest';

// ── requestAnimationFrame / cancelAnimationFrame ────────────
// The engine uses rAF for its render loop. In Node we replace
// it with a synchronous no-op so tests can call _loop() or
// markDirty() without a real frame scheduler.

let _rafId = 0;
const _rafCallbacks = new Map();

globalThis.requestAnimationFrame = (cb) => {
  const id = ++_rafId;
  _rafCallbacks.set(id, cb);
  // Execute callback on next microtask to simulate async frame
  Promise.resolve().then(() => {
    if (_rafCallbacks.has(id)) {
      _rafCallbacks.delete(id);
      cb(performance.now());
    }
  });
  return id;
};

globalThis.cancelAnimationFrame = (id) => {
  _rafCallbacks.delete(id);
};

// ── Minimal CanvasRenderingContext2D stub ────────────────────
// Engine calls getContext('2d') and uses ctx for drawing.
// We stub all used methods as no-ops so engine tests don't crash.

class MockCanvasRenderingContext2D {
  constructor() {
    this.fillStyle = '';
    this.strokeStyle = '';
    this.lineWidth = 1;
    this.globalAlpha = 1;
    this.font = '';
    this.textAlign = '';
    this.textBaseline = '';
    this.shadowColor = 'transparent';
    this.shadowBlur = 0;
  }

  // Path methods
  beginPath() {}
  closePath() {}
  moveTo() {}
  lineTo() {}
  arc() {}
  arcTo() {}
  rect() {}
  roundRect() {}

  // Drawing methods
  fill() {}
  stroke() {}
  fillRect() {}
  strokeRect() {}
  clearRect() {}
  fillText() {}
  strokeText() {}

  // State management
  save() {}
  restore() {}

  // Transform methods
  setTransform() {}
  translate() {}
  scale() {}
  rotate() {}

  // Line dash
  setLineDash() {}
  getLineDash() { return []; }

  // Image data (for pixel testing if needed)
  getImageData(x, y, w, h) {
    return { data: new Uint8ClampedArray(w * h * 4), width: w, height: h };
  }
  putImageData() {}

  // Measurement
  measureText(text) {
    return { width: text.length * 7 };
  }
}

// ── HTMLCanvasElement.getContext stub ────────────────────────

class MockHTMLCanvasElement {
  constructor(width = 1280, height = 720) {
    this.width = width;
    this.height = height;
    this.offsetWidth = width;
    this.offsetHeight = height;
    this.style = {};
    this._ctx = new MockCanvasRenderingContext2D();
  }

  getContext(type) {
    if (type === '2d') return this._ctx;
    return null;
  }

  addEventListener() {}
  removeEventListener() {}
  getBoundingClientRect() {
    return { top: 0, left: 0, width: this.width, height: this.height, right: this.width, bottom: this.height };
  }
  toDataURL() { return 'data:image/png;base64,'; }
}

globalThis.MockHTMLCanvasElement = MockHTMLCanvasElement;
globalThis.MockCanvasRenderingContext2D = MockCanvasRenderingContext2D;

// ── ResizeObserver stub ─────────────────────────────────────

globalThis.ResizeObserver = class ResizeObserver {
  constructor(callback) {
    this._callback = callback;
    this._elements = [];
  }
  observe(el) { this._elements.push(el); }
  unobserve(el) { this._elements = this._elements.filter(e => e !== el); }
  disconnect() { this._elements = []; }
  // Test helper: trigger a resize
  _trigger(entries) { this._callback(entries); }
};

// ── Performance.now polyfill (if missing) ───────────────────

if (typeof globalThis.performance === 'undefined') {
  globalThis.performance = { now: () => Date.now() };
}
