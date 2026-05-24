import { describe, it, expect } from 'vitest';
import { hitTestRouter, hitTestBridge, hitTestConnectionLine } from '@/lib/topology/renderer/draw.js';

describe('Hit Testing Geometry', () => {
  describe('hitTestRouter()', () => {
    const el = { x: 100, y: 100, radius: 46 };

    it('returns true if inside radius', () => {
      expect(hitTestRouter(el, 100, 100)).toBe(true); // center
      expect(hitTestRouter(el, 140, 100)).toBe(true); // right edge
      expect(hitTestRouter(el, 100, 55)).toBe(true);  // top edge
    });

    it('returns true for +4px threshold outside radius', () => {
      // Radius is 46. Dist = 49 (46 + 3) -> should hit
      expect(hitTestRouter(el, 149, 100)).toBe(true);
    });

    it('returns false if completely outside', () => {
      // Dist = 51 > (46 + 4)
      expect(hitTestRouter(el, 151, 100)).toBe(false);
      expect(hitTestRouter(el, 0, 0)).toBe(false);
    });
  });

  describe('hitTestBridge()', () => {
    const el = { x: 100, y: 100, radius: 20 }; // hw=20, hh=14.4

    it('returns true if inside AABB', () => {
      expect(hitTestBridge(el, 100, 100)).toBe(true); // center
      expect(hitTestBridge(el, 110, 110)).toBe(true); // corner
    });

    it('returns true for +4px threshold', () => {
      // Right edge + threshold: 100 + 20 + 3 = 123
      expect(hitTestBridge(el, 123, 100)).toBe(true);
      // Bottom edge + threshold: 100 + 14.4 + 3 = 117.4
      expect(hitTestBridge(el, 100, 117)).toBe(true);
    });

    it('returns false if outside', () => {
      expect(hitTestBridge(el, 125, 100)).toBe(false);
      expect(hitTestBridge(el, 100, 120)).toBe(false);
    });
  });

  describe('hitTestConnectionLine()', () => {
    const from = { x: 0, y: 0 };
    const to = { x: 100, y: 0 }; // horizontal line along X axis

    it('returns true for click directly on the line', () => {
      expect(hitTestConnectionLine(from, to, 0, 50, 0, 2)).toBe(true); // center
    });

    it('respects perpendicular offset', () => {
      // Line is offset by 10 units downward (since nx = 0, ny = 1 for a horizontal line dx=100, dy=0)
      const offset = 10;
      
      // Click at y=0 should miss
      expect(hitTestConnectionLine(from, to, offset, 50, 0, 2)).toBe(false);
      
      // Click at y=10 should hit
      expect(hitTestConnectionLine(from, to, offset, 50, 10, 2)).toBe(true);
    });

    it('respects thickness threshold', () => {
      // threshold = 3. 
      expect(hitTestConnectionLine(from, to, 0, 50, 2, 3)).toBe(true); // Dist=2 < 3
      expect(hitTestConnectionLine(from, to, 0, 50, 4, 3)).toBe(false); // Dist=4 > 3
    });

    it('caps hit testing to segment ends (no infinite line)', () => {
      // Click beyond the 'to' point
      expect(hitTestConnectionLine(from, to, 0, 150, 0, 5)).toBe(false);
      // Click before the 'from' point
      expect(hitTestConnectionLine(from, to, 0, -10, 0, 5)).toBe(false);
    });
  });
});
