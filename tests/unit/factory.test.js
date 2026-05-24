import { describe, it, expect } from 'vitest';
import { createRouter, createBridge, createConnectionLines } from '@/lib/topology/factory.js';

describe('Element Factory', () => {
  describe('createRouter()', () => {
    it('creates router with correct default values', () => {
      const cfg = { id: 'r1', x: 100, y: 100 };
      const el = createRouter(cfg);

      expect(el.id).toBe('r1');
      expect(el.type).toBe('router');
      expect(el.className).toBe('router');
      expect(el.label).toBe('r1'); // defaults to id
      expect(el.radius).toBe(46); // default
      expect(el.state.zIndex).toBe(10); // default
      expect(el.state.visible).toBe(true);
      expect(el.state.selected).toBe(false);
    });

    it('respects provided values and meta', () => {
      const cfg = { id: 'r1', label: 'Core', x: 10, y: 20, radius: 60, meta: { custom: true } };
      const el = createRouter(cfg);

      expect(el.label).toBe('Core');
      expect(el.radius).toBe(60);
      expect(el.meta.custom).toBe(true);
    });
  });

  describe('createBridge()', () => {
    it('creates bridge with correct default values', () => {
      const cfg = { id: 'b1', x: 100, y: 100, routerId: 'r1' };
      const el = createBridge(cfg);

      expect(el.id).toBe('b1');
      expect(el.type).toBe('bridge');
      expect(el.label).toBe('V'); // default
      expect(el.radius).toBe(18); // default
      expect(el.routerId).toBe('r1');
      expect(el.state.zIndex).toBe(5); // default
    });
  });

  describe('createConnectionLines() (Explosion Logic)', () => {
    it('creates a single line correctly (lineCount=1)', () => {
      const cfg = { id: 'conn1', fromId: 'r1', toId: 'b1', lineCount: 1 };
      const lines = createConnectionLines(cfg);

      expect(lines).toHaveLength(1);
      const [l0] = lines;
      expect(l0.id).toBe('conn1-line-0');
      expect(l0.type).toBe('connection-line');
      expect(l0.offset).toBe(0);
      expect(l0.direction).toBe('from'); // default
      expect(l0.lineIndex).toBe(0);
      expect(l0.lineTotal).toBe(1);
    });

    it('explodes multi-line bundle with symmetrical offsets (lineCount=3)', () => {
      const cfg = { id: 'conn1', fromId: 'r1', toId: 'b1', lineCount: 3 };
      const lines = createConnectionLines(cfg);

      expect(lines).toHaveLength(3);
      
      // Spacing is 3.5
      expect(lines[0].id).toBe('conn1-line-0');
      expect(lines[0].offset).toBe(-3.5);
      
      expect(lines[1].id).toBe('conn1-line-1');
      expect(lines[1].offset).toBe(0);
      
      expect(lines[2].id).toBe('conn1-line-2');
      expect(lines[2].offset).toBe(3.5);
    });

    it('handles even line counts symmetrically (lineCount=2)', () => {
      const cfg = { id: 'conn1', lineCount: 2 };
      const lines = createConnectionLines(cfg);

      expect(lines).toHaveLength(2);
      expect(lines[0].offset).toBe(-1.75); // -spacing / 2
      expect(lines[1].offset).toBe(1.75);  // +spacing / 2
    });

    it('preserves direction and populates meta', () => {
      const cfg = { id: 'conn1', direction: 'bidirectional', lineCount: 2, meta: { custom: 'data' } };
      const lines = createConnectionLines(cfg);

      expect(lines[0].direction).toBe('bidirectional');
      expect(lines[0].meta.custom).toBe('data');
      expect(lines[0].meta.connectionId).toBe('conn1');
      expect(lines[0].meta.lineIndex).toBe(0);
    });

    it('each line has independent state and style objects', () => {
      const cfg = { id: 'conn1', lineCount: 2 };
      const lines = createConnectionLines(cfg);

      lines[0].state.selected = true;
      lines[0].style.strokeColor = '#f00';

      expect(lines[1].state.selected).toBe(false);
      expect(lines[1].style.strokeColor).toBeUndefined();
    });
  });
});
