'use client';

// ============================================================
//  useTopology HOOK
//  React bridge to the TopologyEngine singleton.
//  Wires: canvas mount/unmount, resize, all pointer + touch
//  events, and syncs engine events → React state.
// ============================================================

import { useRef, useEffect, useState } from 'react';
import { ENGINE } from '@/lib/topology/renderer/engine.js';

/**
 * @param {{
 *   config: object|null,
 *   onSelect?: (el: object|null) => void,
 *   onHover?:  (el: object|null) => void,
 * }} opts
 */
export function useTopology({ config, onSelect, onHover }) {
  /** @type {React.RefObject<HTMLCanvasElement>} */
  const canvasRef = useRef(null);

  // Drag state in a ref — never triggers React re-renders
  const drag  = useRef({ active: false, moved: false, origin: { x: 0, y: 0 } });
  // Pinch-zoom state
  const pinch = useRef(null);

  const [selected,  setSelected]  = useState(null);
  const [hovered,   setHovered]   = useState(null);
  const [zoomPct,   setZoomPct]   = useState(100);
  const [elemCount, setElemCount] = useState(0);
  const [isReady,   setIsReady]   = useState(false);

  // ── 1. Mount engine & subscribe to events ─────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width  = canvas.offsetWidth  || window.innerWidth;
    canvas.height = canvas.offsetHeight || window.innerHeight;

    ENGINE.mount(canvas);
    setIsReady(true);

    const u1 = ENGINE.on('select',   e => { setSelected(e.element); onSelect?.(e.element); });
    const u2 = ENGINE.on('hover',    e => { setHovered(e.element);  onHover?.(e.element);  });
    const u3 = ENGINE.on('viewport', e => setZoomPct(Math.round(e.zoom * 100)));
    const u4 = ENGINE.on('loaded',   e => setElemCount(e.count));

    return () => { u1(); u2(); u3(); u4(); ENGINE.unmount(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 2. Resize observer ────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        ENGINE.resize(
          Math.round(entry.contentRect.width),
          Math.round(entry.contentRect.height),
        );
      }
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  // ── 3. Load / reload config ───────────────────────────────
  useEffect(() => {
    if (config) ENGINE.loadConfig(config);
  }, [config]);

  // ── 4. Wire pointer & touch events ───────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Wheel zoom
    const onWheel = e => ENGINE.onWheel(e);

    // Mouse
    const onMouseDown = e => {
      const r = ENGINE.onMouseDown(e);
      drag.current = { active: r.dragging, moved: false, origin: r.origin };
    };

    const onMouseMove = e => {
      if (!drag.current.active) {
        ENGINE.onMouseMove(e, false, drag.current.origin);
        return;
      }
      const dx = e.clientX - drag.current.origin.x;
      const dy = e.clientY - drag.current.origin.y;
      if (Math.abs(dx) + Math.abs(dy) > 3) drag.current.moved = true;
      drag.current.origin = ENGINE.onMouseMove(e, true, drag.current.origin);
    };

    const onMouseUp = e => {
      ENGINE.onMouseUp(e, drag.current.active, drag.current.moved);
      drag.current.active = false;
    };

    // Touch
    const onTouchStart = e => {
      e.preventDefault();
      if (e.touches.length === 2) {
        const dx = e.touches[1].clientX - e.touches[0].clientX;
        const dy = e.touches[1].clientY - e.touches[0].clientY;
        pinch.current       = { dist: Math.hypot(dx, dy) };
        drag.current.active = false;
      } else {
        pinch.current = null;
        drag.current  = {
          active: true,
          moved:  false,
          origin: { x: e.touches[0].clientX, y: e.touches[0].clientY },
        };
      }
    };

    const onTouchMove = e => {
      e.preventDefault();
      if (e.touches.length === 2 && pinch.current) {
        const dx   = e.touches[1].clientX - e.touches[0].clientX;
        const dy   = e.touches[1].clientY - e.touches[0].clientY;
        const dist = Math.hypot(dx, dy);
        const cx   = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const cy   = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        ENGINE.viewport.zoomAt(dist / pinch.current.dist, cx, cy);
        pinch.current = { dist };
        ENGINE.markDirty();
      } else if (e.touches.length === 1 && drag.current.active) {
        const fake  = { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
        drag.current.moved  = true;
        drag.current.origin = ENGINE.onMouseMove(fake, true, drag.current.origin);
      }
    };

    const onTouchEnd = e => {
      if (!drag.current.moved && drag.current.active) {
        const t    = e.changedTouches[0];
        const fake = { clientX: t.clientX, clientY: t.clientY, button: 0 };
        ENGINE.onMouseUp(fake, true, false);
      }
      drag.current.active = false;
      pinch.current       = null;
    };

    canvas.addEventListener('wheel',      onWheel,      { passive: false });
    canvas.addEventListener('mousedown',  onMouseDown);
    window.addEventListener('mousemove',  onMouseMove);
    window.addEventListener('mouseup',    onMouseUp);
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove',  onTouchMove,  { passive: false });
    canvas.addEventListener('touchend',   onTouchEnd);

    return () => {
      canvas.removeEventListener('wheel',      onWheel);
      canvas.removeEventListener('mousedown',  onMouseDown);
      window.removeEventListener('mousemove',  onMouseMove);
      window.removeEventListener('mouseup',    onMouseUp);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove',  onTouchMove);
      canvas.removeEventListener('touchend',   onTouchEnd);
    };
  }, []);

  // ── 5. Cursor ─────────────────────────────────────────────
  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.style.cursor = hovered ? 'pointer' : 'grab';
    }
  }, [hovered]);

  return { canvasRef, engine: ENGINE, selected, hovered, zoomPct, elemCount, isReady };
}
