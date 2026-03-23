"use client";

// ============================================================
//  TOPOLOGY PAGE
//  Client-side root. Responsibilities:
//    1. Hold config + grid state (rows/cols adjustable from UI)
//    2. Fetch new config from /api/topology when grid changes
//    3. Expose window.TopologyAPI for external JS adjustments
// ============================================================

import { useEffect, useState, useCallback, useTransition } from "react";
import { TopologyCanvas } from "./TopologyCanvas.jsx";
import { ENGINE } from "@/lib/topology/renderer/engine.js";
import GridControls from "./gridControl/GridControls.jsx";

/**
 * @param {{ initialConfig: object }} props
 */
export function TopologyPage({ initialConfig }) {
  const [config, setConfig] = useState(initialConfig);
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSelect = useCallback((el) => {
    if (el) console.debug("[Topology] selected:", el.id, el.type);
  }, []);

  // ── Fetch new config from API when grid size changes ──────
  const applyGrid = useCallback(async (newRows, newCols) => {
    setRows(newRows);
    setCols(newCols);
    setLoading(true);

    try {
      const res = await fetch(`/api/topology?rows=${newRows}&cols=${newCols}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const newConfig = await res.json();
      // useTransition keeps the old frame visible while React batches the update
      startTransition(() => setConfig(newConfig));
    } catch (err) {
      console.error("[Topology] failed to fetch config:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Expose window.TopologyAPI ─────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;

    window.TopologyAPI = {
      getElementById: (id) => ENGINE.registry.getElementById(id),
      querySelector: (sel) => ENGINE.registry.querySelector(sel),
      querySelectorAll: (sel) => ENGINE.registry.querySelectorAll(sel),

      applyStyle: (selector, style) => {
        ENGINE.registry.applyStyle(selector, style);
        ENGINE.markDirty();
      },
      applyState: (selector, state) => {
        ENGINE.registry.applyState(selector, state);
        ENGINE.markDirty();
      },

      select: (id) => ENGINE.selectById(id),
      clearSelection: () => ENGINE.clearSelection(),
      fitToScreen: () => ENGINE.fitToScreen(),
      markDirty: () => ENGINE.markDirty(),

      // Also expose grid control programmatically
      setGrid: (r, c) => applyGrid(r, c),
      reload: (cfg) => startTransition(() => setConfig(cfg)),

      engine: ENGINE,
      registry: ENGINE.registry,
    };

    console.group(
      "%c[TopologyAPI] Ready",
      "color:#64c8ff;font-weight:bold;font-size:13px",
    );
    console.log('  TopologyAPI.getElementById("router-0-0")');
    console.log('  TopologyAPI.querySelectorAll("bridge")');
    console.log('  TopologyAPI.applyStyle("router", { strokeColor: "#0f0" })');
    console.log("  TopologyAPI.setGrid(5, 5)    ← change grid from JS too");
    console.log("  TopologyAPI.markDirty()");
    console.groupEnd();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applyGrid]);

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
      {/* Grid size controls — centered top bar */}
      <GridControls
        rows={rows}
        cols={cols}
        loading={loading || isPending}
        onApply={applyGrid}
      />

      <TopologyCanvas
        config={config}
        onSelect={handleSelect}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
