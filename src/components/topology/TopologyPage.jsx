'use client';

// ============================================================
//  TOPOLOGY PAGE
//  Client-side root. Two jobs:
//    1. Hold config state so TopologyAPI.reload() works.
//    2. Expose window.TopologyAPI — the "unpredictable JS
//       adjustment" surface for any external script.
//
//  window.TopologyAPI examples (browser console or any JS):
//
//    TopologyAPI.getElementById('router-0-0').style.fillColor = '#002'
//    TopologyAPI.querySelectorAll('bridge').forEach(b => b.style.strokeColor = '#fa0')
//    TopologyAPI.applyStyle('[type=router-router]', { strokeColor: '#0ff', alpha: 1 })
//    TopologyAPI.applyState('bridge', { visible: false })
//    TopologyAPI.select('router-1-1')
//    TopologyAPI.markDirty()
//    TopologyAPI.reload(await fetch('/api/topology?rows=5&cols=5').then(r => r.json()))
// ============================================================

import { useEffect, useState, useCallback } from 'react';
import { TopologyCanvas } from './TopologyCanvas.jsx';
import { ENGINE } from '@/lib/topology/renderer/engine.js';

/**
 * @param {{ initialConfig: object }} props
 */
export function TopologyPage({ initialConfig }) {
  const [config, setConfig] = useState(initialConfig);

  const handleSelect = useCallback(el => {
    if (el) console.debug('[Topology] selected:', el.id, el.type);
  }, []);

  // ── Expose window.TopologyAPI ─────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.TopologyAPI = {
      // ── DOM-mirror selectors ──────────────────────────────
      getElementById:   id  => ENGINE.registry.getElementById(id),
      querySelector:    sel => ENGINE.registry.querySelector(sel),
      querySelectorAll: sel => ENGINE.registry.querySelectorAll(sel),

      // ── Bulk helpers ──────────────────────────────────────
      applyStyle: (selector, style) => {
        ENGINE.registry.applyStyle(selector, style);
        ENGINE.markDirty();
      },
      applyState: (selector, state) => {
        ENGINE.registry.applyState(selector, state);
        ENGINE.markDirty();
      },

      // ── Engine controls ───────────────────────────────────
      select:         id => ENGINE.selectById(id),
      clearSelection: ()  => ENGINE.clearSelection(),
      fitToScreen:    ()  => ENGINE.fitToScreen(),
      markDirty:      ()  => ENGINE.markDirty(),

      // ── Live config reload ────────────────────────────────
      reload: cfg => setConfig(cfg),

      // ── Raw handles (advanced use) ────────────────────────
      engine:   ENGINE,
      registry: ENGINE.registry,
    };

    // Developer guide in console
    console.group('%c[TopologyAPI] Ready', 'color:#64c8ff;font-weight:bold;font-size:13px');
    console.log('%cSelectors:', 'color:#8dd4ff');
    console.log('  TopologyAPI.getElementById("router-0-0")');
    console.log('  TopologyAPI.querySelectorAll("bridge")');
    console.log('  TopologyAPI.querySelector("#router-1-1")');
    console.log('  TopologyAPI.querySelectorAll("[type=router-router]")');
    console.log('  TopologyAPI.querySelectorAll("router, bridge")');
    console.log('%cStyle (call markDirty after manual edits):', 'color:#8dd4ff');
    console.log('  TopologyAPI.applyStyle("router", { strokeColor: "#0f0" })');
    console.log('  const r = TopologyAPI.getElementById("router-0-0")');
    console.log('  r.style.fillColor = "#002"; TopologyAPI.markDirty()');
    console.log('%cState:', 'color:#8dd4ff');
    console.log('  TopologyAPI.applyState("bridge", { visible: false })');
    console.log('%cNavigation:', 'color:#8dd4ff');
    console.log('  TopologyAPI.select("router-1-1")');
    console.log('  TopologyAPI.fitToScreen()');
    console.log('%cReload:', 'color:#8dd4ff');
    console.log('  TopologyAPI.reload(await fetch("/api/topology?rows=5&cols=5").then(r=>r.json()))');
    console.groupEnd();
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <TopologyCanvas
        config={config}
        onSelect={handleSelect}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
