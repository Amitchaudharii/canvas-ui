'use client';

// ============================================================
//  ELEMENT REGISTRY
//  Mirrors the browser DOM selector API for canvas elements.
//  O(1) by id — O(k) by type, class, or attribute.
//
//  Supported selectors:
//    getElementById('router-0-0')
//    querySelector('#router-0-0')
//    querySelector('.router')
//    querySelectorAll('bridge')
//    querySelectorAll('[type=router-router]')
//    querySelectorAll('router, bridge')    ← multi-selector
// ============================================================

export class ElementRegistry {
  constructor() {
    /** @type {Map<string, object>} */
    this._byId    = new Map();
    /** @type {Map<string, Set<object>>} */
    this._byType  = new Map();
    /** @type {Map<string, Set<object>>} */
    this._byClass = new Map();
    /** @type {Map<string, Map<string, Set<object>>>} */
    this._byAttr  = new Map();
  }

  // ── Registration ─────────────────────────────────────────────

  /**
   * Register a canvas element so it becomes queryable.
   * @param {object} el
   * @returns {object} el
   */
  register(el) {
    this._byId.set(el.id, el);
    this._idx(this._byType,  el.type,      el);
    this._idx(this._byClass, el.className, el);

    // Index every meta key for [key=value] attribute selectors
    for (const [k, v] of Object.entries(el.meta ?? {})) {
      const key = String(k);
      const val = String(v);
      if (!this._byAttr.has(key)) this._byAttr.set(key, new Map());
      this._idx(this._byAttr.get(key), val, el);
    }
    return el;
  }

  /**
   * Remove an element from all indexes.
   * @param {string} id
   */
  unregister(id) {
    const el = this._byId.get(id);
    if (!el) return;
    this._byId.delete(id);
    this._byType.get(el.type)?.delete(el);
    this._byClass.get(el.className)?.delete(el);
    for (const [k, v] of Object.entries(el.meta ?? {})) {
      this._byAttr.get(String(k))?.get(String(v))?.delete(el);
    }
  }

  /** Remove all elements. */
  clear() {
    this._byId.clear();
    this._byType.clear();
    this._byClass.clear();
    this._byAttr.clear();
  }

  // ── DOM-style query API ──────────────────────────────────────

  /**
   * Exact mirror of document.getElementById.
   * @param {string} id
   * @returns {object|null}
   */
  getElementById(id) {
    return this._byId.get(id) ?? null;
  }

  /**
   * Exact mirror of document.querySelector.
   * Supports: #id | .class | type | [attr=val] | "a, b"
   * @param {string} selector
   * @returns {object|null}
   */
  querySelector(selector) {
    return this._resolve(selector.trim())[0] ?? null;
  }

  /**
   * Exact mirror of document.querySelectorAll.
   * @param {string} selector
   * @returns {object[]}
   */
  querySelectorAll(selector) {
    return this._resolve(selector.trim());
  }

  /**
   * Get all elements of a specific type.
   * @param {'router'|'bridge'|'connection'} type
   * @returns {{ elements: object[], count: number }}
   */
  getByType(type) {
    const elements = [...(this._byType.get(type) ?? [])];
    return { elements, count: elements.length };
  }

  /** @returns {object[]} */
  getAll() {
    return [...this._byId.values()];
  }

  get size() {
    return this._byId.size;
  }

  // ── Bulk mutation helpers ────────────────────────────────────

  /**
   * Apply a partial style to all elements matching selector.
   * @param {string} selector
   * @param {object} style
   */
  applyStyle(selector, style) {
    for (const el of this.querySelectorAll(selector)) {
      Object.assign(el.style, style);
    }
  }

  /**
   * Apply a partial state to all elements matching selector.
   * @param {string} selector
   * @param {object} state
   */
  applyState(selector, state) {
    for (const el of this.querySelectorAll(selector)) {
      Object.assign(el.state, state);
    }
  }

  // ── Private ──────────────────────────────────────────────────

  _idx(map, key, el) {
    if (!map.has(key)) map.set(key, new Set());
    map.get(key).add(el);
  }

  _resolve(selector) {
    // Multi-selector: "router, bridge"
    if (selector.includes(',')) {
      const seen = new Map();
      for (const s of selector.split(',')) {
        for (const el of this._resolve(s.trim())) seen.set(el.id, el);
      }
      return [...seen.values()];
    }

    if (selector.startsWith('#')) {
      const el = this._byId.get(selector.slice(1));
      return el ? [el] : [];
    }

    if (selector.startsWith('.')) {
      return [...(this._byClass.get(selector.slice(1)) ?? [])];
    }

    if (selector.startsWith('[')) {
      const m = selector.match(/^\[([^=\]]+)=([^\]]+)\]$/);
      if (m) return [...(this._byAttr.get(m[1])?.get(m[2]) ?? [])];
      return [];
    }

    // Plain type name: router | bridge | connection
    return [...(this._byType.get(selector) ?? [])];
  }
}
