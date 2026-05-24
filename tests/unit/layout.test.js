import { describe, it, expect } from 'vitest';
import { applyGridLayout, bridgePositionsAround, nudgeOverlaps, computeBBox } from '@/lib/topology/layout.js';

describe('Layout Math', () => {
  describe('applyGridLayout()', () => {
    it('assigns x/y positions in a grid based on index', () => {
      const routers = [
        { id: 'r0' }, { id: 'r1' }, { id: 'r2' },
        { id: 'r3' }, { id: 'r4' }
      ];
      const layout = applyGridLayout(routers, { cols: 3, spacingX: 100, spacingY: 100, offsetX: 0, offsetY: 0 });

      // Row 0
      expect(layout[0]).toMatchObject({ x: 0, y: 0 });
      expect(layout[1]).toMatchObject({ x: 100, y: 0 });
      expect(layout[2]).toMatchObject({ x: 200, y: 0 });
      // Row 1
      expect(layout[3]).toMatchObject({ x: 0, y: 100 });
      expect(layout[4]).toMatchObject({ x: 100, y: 100 });
    });

    it('preserves existing x/y values', () => {
      const routers = [{ id: 'r0', x: 500, y: 500 }, { id: 'r1' }];
      const layout = applyGridLayout(routers, { cols: 3, spacingX: 100, spacingY: 100, offsetX: 0, offsetY: 0 });

      expect(layout[0]).toMatchObject({ x: 500, y: 500 }); // preserved
      expect(layout[1]).toMatchObject({ x: 100, y: 0 });   // auto-assigned
    });
  });

  describe('bridgePositionsAround()', () => {
    it('returns evenly spaced points around center', () => {
      const center = { x: 0, y: 0 };
      const orbit = 100;
      const count = 4;
      const positions = bridgePositionsAround(center, count, { orbit, startAngle: 0 });

      expect(positions).toHaveLength(4);
      // At angle 0, PI/2, PI, 3PI/2
      expect(positions[0].x).toBeCloseTo(100);
      expect(positions[0].y).toBeCloseTo(0);
      
      expect(positions[1].x).toBeCloseTo(0);
      expect(positions[1].y).toBeCloseTo(100);
      
      expect(positions[2].x).toBeCloseTo(-100);
      expect(positions[2].y).toBeCloseTo(0);
      
      expect(positions[3].x).toBeCloseTo(0);
      expect(positions[3].y).toBeCloseTo(-100);
    });

    it('defaults to startAngle = -PI/2 (top)', () => {
      const positions = bridgePositionsAround({ x: 0, y: 0 }, 1, { orbit: 100 });
      expect(positions[0].x).toBeCloseTo(0);
      expect(positions[0].y).toBeCloseTo(-100);
    });
  });

  describe('nudgeOverlaps()', () => {
    it('pushes overlapping elements apart', () => {
      // Two points at almost same position (needs slight offset for normal vector calculation)
      const bridges = [{ x: 0, y: 0 }, { x: 0.1, y: 0 }];
      const nudged = nudgeOverlaps(bridges, 40, 1);

      // Distance should now be > 0
      const dx = nudged[1].x - nudged[0].x;
      const dy = nudged[1].y - nudged[0].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      expect(dist).toBeGreaterThan(0);
    });

    it('does nothing if elements are far apart', () => {
      const bridges = [{ x: 0, y: 0 }, { x: 100, y: 0 }];
      const nudged = nudgeOverlaps(bridges, 40, 1);

      expect(nudged[0].x).toBe(0);
      expect(nudged[1].x).toBe(100);
    });
  });

  describe('computeBBox()', () => {
    it('returns correct bounding box for points', () => {
      const elements = [
        { x: 10, y: 20 },
        { x: 100, y: -50 },
        { x: 40, y: 200 }
      ];
      const bbox = computeBBox(elements);

      expect(bbox.x).toBe(10);
      expect(bbox.y).toBe(-50);
      expect(bbox.width).toBe(100 - 10); // 90
      expect(bbox.height).toBe(200 - -50); // 250
    });

    it('returns zeroes for empty array', () => {
      const bbox = computeBBox([]);
      expect(bbox).toEqual({ x: 0, y: 0, width: 0, height: 0 });
    });
  });
});
