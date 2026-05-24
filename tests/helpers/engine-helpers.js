// ============================================================
//  ENGINE HELPERS
//  Utilities for creating, mounting, and testing the
//  TopologyEngine in isolation (Vitest unit tests).
// ============================================================

import { TopologyEngine } from '../../src/lib/topology/renderer/engine.js';

/**
 * Create a fresh TopologyEngine instance (NOT the singleton).
 * Gives each test its own isolated engine.
 * @returns {TopologyEngine}
 */
export function createTestEngine() {
  return new TopologyEngine();
}

/**
 * Create a mock canvas element suitable for engine.mount().
 * @param {number} width
 * @param {number} height
 * @returns {object}
 */
export function createMockCanvas(width = 1280, height = 720) {
  return new globalThis.MockHTMLCanvasElement(width, height);
}

/**
 * Mount a test engine with a mock canvas and load a config.
 * Returns { engine, canvas } for further testing.
 *
 * @param {object} config  topology config
 * @param {{ width?: number, height?: number }} opts
 * @returns {{ engine: TopologyEngine, canvas: object }}
 */
export function mountWithConfig(config, opts = {}) {
  const { width = 1280, height = 720 } = opts;
  const engine = createTestEngine();
  const canvas = createMockCanvas(width, height);

  engine.mount(canvas);
  engine.loadConfig(config);

  return { engine, canvas };
}

/**
 * Collect a specified number of events from the engine.
 * Returns a promise that resolves with the collected payloads.
 *
 * @param {TopologyEngine} engine
 * @param {string} eventName
 * @param {number} count  how many events to collect
 * @param {number} timeout  max wait time in ms
 * @returns {Promise<object[]>}
 */
export function collectEvents(engine, eventName, count = 1, timeout = 2000) {
  return new Promise((resolve, reject) => {
    const events = [];
    const timer = setTimeout(() => {
      unsub();
      reject(new Error(`Timeout: only collected ${events.length}/${count} '${eventName}' events`));
    }, timeout);

    const unsub = engine.on(eventName, (payload) => {
      events.push(payload);
      if (events.length >= count) {
        clearTimeout(timer);
        unsub();
        resolve(events);
      }
    });
  });
}

/**
 * Wait for a single event from the engine.
 * @param {TopologyEngine} engine
 * @param {string} eventName
 * @param {number} timeout
 * @returns {Promise<object>}
 */
export async function waitForEvent(engine, eventName, timeout = 2000) {
  const [event] = await collectEvents(engine, eventName, 1, timeout);
  return event;
}

/**
 * Simulate a complete mouse click at world coordinates.
 * Converts world to screen, then dispatches mousedown + mouseup.
 *
 * @param {TopologyEngine} engine
 * @param {number} wx  world x
 * @param {number} wy  world y
 */
export function simulateEngineClick(engine, wx, wy) {
  const screen = engine.viewport.toScreen(wx, wy);
  const fakeEvent = {
    clientX: screen.x,
    clientY: screen.y,
    button: 0,
    preventDefault: () => {},
  };

  const dragState = engine.onMouseDown(fakeEvent);
  engine.onMouseUp(fakeEvent, dragState.dragging, false);
}

/**
 * Simulate a mouse hover at world coordinates.
 * @param {TopologyEngine} engine
 * @param {number} wx  world x
 * @param {number} wy  world y
 */
export function simulateEngineHover(engine, wx, wy) {
  const screen = engine.viewport.toScreen(wx, wy);
  const fakeEvent = {
    clientX: screen.x,
    clientY: screen.y,
    button: 0,
    preventDefault: () => {},
  };

  engine.onMouseMove(fakeEvent, false, { x: 0, y: 0 });
}
