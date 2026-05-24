// ============================================================
//  CANVAS ASSERTIONS
//  Custom assertion helpers for validating topology canvas
//  state, registry contents, and draw order.
// ============================================================

import { expect } from 'vitest';

/**
 * Assert an element is fully registered in all relevant indexes.
 * @param {import('../../src/lib/topology/registry.js').ElementRegistry} registry
 * @param {string} id
 * @param {string} type
 * @param {string} className
 */
export function expectElementRegistered(registry, id, type, className) {
  // In _byId
  const el = registry.getElementById(id);
  expect(el).not.toBeNull();
  expect(el.id).toBe(id);

  // In _byType
  const byType = registry.querySelectorAll(type);
  expect(byType.some(e => e.id === id)).toBe(true);

  // In _byClass
  const byClass = registry.querySelectorAll(`.${className}`);
  expect(byClass.some(e => e.id === id)).toBe(true);
}

/**
 * Assert the total number of elements of a given type.
 * @param {import('../../src/lib/topology/registry.js').ElementRegistry} registry
 * @param {string} type
 * @param {number} expectedCount
 */
export function expectElementCount(registry, type, expectedCount) {
  const { count } = registry.getByType(type);
  expect(count).toBe(expectedCount);
}

/**
 * Assert that draw order follows: connection-lines → bridges → routers.
 * Elements are drawn first-to-last, so later elements appear on top.
 * @param {object[]} drawOrder
 */
export function expectDrawOrderCorrect(drawOrder) {
  let phase = 'connection-line'; // must start with connection-lines
  const validTransitions = {
    'connection-line': ['connection-line', 'bridge'],
    'bridge': ['bridge', 'router'],
    'router': ['router'],
  };

  for (const el of drawOrder) {
    if (el.type !== phase) {
      const allowed = validTransitions[phase];
      expect(allowed).toContain(el.type);
      phase = el.type;
    }
  }
}

/**
 * Assert an element's state matches the expected values.
 * @param {object} element
 * @param {object} expectedState  partial state object
 */
export function expectStateEquals(element, expectedState) {
  for (const [key, value] of Object.entries(expectedState)) {
    expect(element.state[key]).toBe(value);
  }
}

/**
 * Assert an element's style has the expected properties.
 * @param {object} element
 * @param {object} expectedStyle  partial style object
 */
export function expectStyleApplied(element, expectedStyle) {
  for (const [key, value] of Object.entries(expectedStyle)) {
    expect(element.style[key]).toBe(value);
  }
}

/**
 * Assert all connection lines in a bundle have unique ids.
 * @param {object[]} lines
 */
export function expectUniqueIds(lines) {
  const ids = lines.map(l => l.id);
  const unique = new Set(ids);
  expect(unique.size).toBe(ids.length);
}

/**
 * Assert connection line offsets are symmetrical around center.
 * @param {object[]} lines  sorted by lineIndex
 */
export function expectSymmetricalOffsets(lines) {
  const offsets = lines.map(l => l.offset);
  const sum = offsets.reduce((a, b) => a + b, 0);
  expect(Math.abs(sum)).toBeLessThan(0.0001); // should sum to ~0
}

/**
 * Assert that an element's meta contains expected key-value pairs.
 * @param {object} element
 * @param {object} expectedMeta
 */
export function expectMetaContains(element, expectedMeta) {
  for (const [key, value] of Object.entries(expectedMeta)) {
    expect(element.meta[key]).toBe(value);
  }
}
