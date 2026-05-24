import { describe, it, expect, beforeEach } from 'vitest';
import { ViewportManager } from '@/lib/topology/renderer/viewport.js';
import { assertScreenRoundTrip, assertWorldRoundTrip, assertZoomFocalStable } from '../helpers/viewport-helpers.js';

describe('ViewportManager', () => {
  let vp;

  beforeEach(() => {
    vp = new ViewportManager();
    vp.setSize(1000, 1000);
  });

  describe('Transforms', () => {
    it('toWorld() is identity at zoom=1, pan=0', () => {
      const w = vp.toWorld(150, 200);
      expect(w).toEqual({ x: 150, y: 200 });
    });

    it('toScreen() is identity at zoom=1, pan=0', () => {
      const s = vp.toScreen(150, 200);
      expect(s).toEqual({ x: 150, y: 200 });
    });

    it('toWorld() accounts for pan', () => {
      vp.pan(50, 50);
      // Screen(100,100) -> pan 50 -> World(50,50)
      const w = vp.toWorld(100, 100);
      expect(w).toEqual({ x: 50, y: 50 });
    });

    it('toScreen() accounts for pan', () => {
      vp.pan(50, 50);
      // World(50,50) -> pan 50 -> Screen(100,100)
      const s = vp.toScreen(50, 50);
      expect(s).toEqual({ x: 100, y: 100 });
    });

    it('toWorld() accounts for zoom', () => {
      vp.zoom = 2;
      // Screen(100,100) -> zoom 2 -> World(50,50)
      const w = vp.toWorld(100, 100);
      expect(w).toEqual({ x: 50, y: 50 });
    });

    it('round-trips screen -> world -> screen', () => {
      vp.pan(123, -45);
      vp.zoom = 1.7;
      assertScreenRoundTrip(vp, 400, 500);
    });

    it('round-trips world -> screen -> world', () => {
      vp.pan(-80, 60);
      vp.zoom = 0.4;
      assertWorldRoundTrip(vp, -200, 300);
    });
  });

  describe('Zoom Math', () => {
    it('zoomAt() scales zoom property', () => {
      vp.zoomAt(1.5, 500, 500);
      expect(vp.zoom).toBe(1.5);
    });

    it('zoomAt() keeps focal point stationary in world space', () => {
      // Zoom in on screen point (300, 400)
      assertZoomFocalStable(vp, 300, 400, 2.0);
    });

    it('zoomAt() defaults to center of screen', () => {
      vp.zoomAt(2.0);
      expect(vp.panX).toBe(-500); // (500 - 500) * 2
      expect(vp.panY).toBe(-500);
    });

    it('clamps zoom to minZoom and maxZoom', () => {
      vp.zoomAt(0.01);
      expect(vp.zoom).toBe(vp.minZoom); // 0.04

      vp.zoomAt(1000);
      expect(vp.zoom).toBe(vp.maxZoom); // 10
    });
  });

  describe('fitToBBox()', () => {
    it('centers and scales bbox into viewport', () => {
      const bbox = { x: 0, y: 0, width: 400, height: 400 };
      vp.fitToBBox(bbox, 50); // 50px padding -> total 500x500

      // Viewport is 1000x1000, content is 500x500 -> zoom should be 2
      expect(vp.zoom).toBe(2);

      // Center of content (200, 200) should map to center of screen (500, 500)
      const centerScreen = vp.toScreen(200, 200);
      expect(centerScreen.x).toBe(500);
      expect(centerScreen.y).toBe(500);
    });

    it('does nothing for zero-size bbox', () => {
      const bbox = { x: 0, y: 0, width: 0, height: 0 };
      vp.fitToBBox(bbox);
      expect(vp.zoom).toBe(1);
    });
  });

  describe('Misc', () => {
    it('pan() adds to panX/Y', () => {
      vp.pan(10, -20);
      vp.pan(5, 5);
      expect(vp.panX).toBe(15);
      expect(vp.panY).toBe(-15);
    });

    it('reset() sets to defaults', () => {
      vp.zoom = 5;
      vp.panX = 100;
      vp.panY = 200;
      vp.reset();
      expect(vp.zoom).toBe(1);
      expect(vp.panX).toBe(0);
      expect(vp.panY).toBe(0);
    });

    it('zoomPercent returns integer percentage', () => {
      vp.zoom = 1.234;
      expect(vp.zoomPercent).toBe(123);
    });
  });
});
