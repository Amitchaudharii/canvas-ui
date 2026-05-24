import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createTestEngine, createMockCanvas, mountWithConfig, collectEvents, waitForEvent } from '../helpers/engine-helpers.js';
import { createMinimalConfig, createConnectionBundleConfig } from '../helpers/topology-generators.js';

describe('TopologyEngine', () => {
  let engine;

  beforeEach(() => {
    engine = createTestEngine();
  });

  describe('Lifecycle & Canvas', () => {
    it('mounts and sets up viewport size', () => {
      const canvas = createMockCanvas(800, 600);
      engine.mount(canvas);
      
      expect(engine._canvas).toBe(canvas);
      expect(engine._ctx).toBeTruthy();
      expect(engine.viewport._w).toBe(800);
      expect(engine.viewport._h).toBe(600);
    });

    it('resize() updates dimensions', () => {
      const canvas = createMockCanvas(800, 600);
      engine.mount(canvas);
      engine.resize(1024, 768);
      
      expect(canvas.width).toBe(1024);
      expect(canvas.height).toBe(768);
      expect(engine.viewport._w).toBe(1024);
      expect(engine._dirty).toBe(true);
    });

    it('unmount() cleans up rAF and refs', () => {
      const canvas = createMockCanvas();
      engine.mount(canvas);
      engine.unmount();
      
      expect(engine._raf).toBeNull();
      expect(engine._canvas).toBeNull();
      expect(engine._ctx).toBeNull();
    });
  });

  describe('Config Loading & Data Structures', () => {
    it('loads config and populates registry', () => {
      const config = createMinimalConfig(); // 1 router, 1 bridge, 1 line
      mountWithConfig(config);
      
      expect(engine.registry.size).toBe(3);
      expect(engine.registry.getElementById('router-0-0')).toBeTruthy();
      expect(engine.registry.getElementById('conn-bridge-0-0-0-line-0')).toBeTruthy();
    });

    it('explodes connection bundles into separate elements in draw order', () => {
      // 1 router, 1 bridge, 1 connection with lineCount=3
      const config = createConnectionBundleConfig(3);
      mountWithConfig(config);
      
      // Total = 1 router + 1 bridge + 3 lines = 5
      expect(engine.registry.size).toBe(5);
      
      // Draw order: connections -> bridges -> routers
      expect(engine._drawOrder).toHaveLength(5);
      expect(engine._drawOrder[0].type).toBe('connection-line');
      expect(engine._drawOrder[1].type).toBe('connection-line');
      expect(engine._drawOrder[2].type).toBe('connection-line');
      expect(engine._drawOrder[3].type).toBe('bridge');
      expect(engine._drawOrder[4].type).toBe('router');
    });

    it('emits loaded event', async () => {
      const canvas = createMockCanvas();
      engine.mount(canvas);
      
      const loadedPromise = waitForEvent(engine, 'loaded');
      engine.loadConfig(createMinimalConfig());
      
      const evt = await loadedPromise;
      expect(evt.count).toBe(3);
    });
  });

  describe('Selection & Hover State', () => {
    beforeEach(() => {
      mountWithConfig(createMinimalConfig());
    });

    it('selectById() updates state and emits select event', async () => {
      const selectPromise = waitForEvent(engine, 'select');
      
      const el = engine.selectById('router-0-0');
      expect(el.state.selected).toBe(true);
      expect(engine._selected).toBe(el);
      
      const evt = await selectPromise;
      expect(evt.element).toBe(el);
      expect(evt.previous).toBeNull();
    });

    it('clearSelection() resets state', () => {
      engine.selectById('router-0-0');
      engine.clearSelection();
      
      expect(engine._selected).toBeNull();
      expect(engine.registry.getElementById('router-0-0').state.selected).toBe(false);
    });

    it('mouse hover updates state and emits hover event', async () => {
      // We know router-0-0 is at (200, 200) from minimal config
      // Convert world 200,200 to screen for the mouse event
      const screen = engine.viewport.toScreen(200, 200);
      
      const hoverPromise = waitForEvent(engine, 'hover');
      engine.onMouseMove({ clientX: screen.x, clientY: screen.y }, false, { x:0, y:0 });
      
      const evt = await hoverPromise;
      expect(evt.element.id).toBe('router-0-0');
      expect(evt.element.state.hovered).toBe(true);
      expect(engine._hovered).toBe(evt.element);
    });
  });

  describe('Hit Test Logic', () => {
    beforeEach(() => {
      mountWithConfig(createMinimalConfig());
    });

    it('hit test respects disabled and visible states', () => {
      const r = engine.registry.getElementById('router-0-0');
      
      // Default: hit
      expect(engine._hitTest(200, 200)).toBe(r);
      
      // Disabled: miss
      r.state.disabled = true;
      expect(engine._hitTest(200, 200)).toBeNull();
      r.state.disabled = false;
      
      // Invisible: miss
      r.state.visible = false;
      expect(engine._hitTest(200, 200)).toBeNull();
    });

    it('hit test prioritizes top-most elements', () => {
      // Both router and bridge at same coordinate
      const r = engine.registry.getElementById('router-0-0');
      const b = engine.registry.getElementById('bridge-0-0-0');
      
      // Force them to overlap for test
      b.x = 200; b.y = 200;
      engine._positions.set(b.id, { x: 200, y: 200, radius: 18 });
      
      // Router is drawn last (top), so it should be hit first
      expect(engine._hitTest(200, 200)).toBe(r);
    });
  });

  describe('Viewport API Wrapper', () => {
    it('zoomIn / zoomOut emit viewport events', async () => {
      mountWithConfig(createMinimalConfig());
      
      const vpPromise = waitForEvent(engine, 'viewport');
      engine.zoomIn();
      
      const evt = await vpPromise;
      expect(evt.zoom).toBeGreaterThan(1);
      expect(engine._dirty).toBe(true);
    });
  });
});
