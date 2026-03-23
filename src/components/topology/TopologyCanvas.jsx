'use client';

// ============================================================
//  TOPOLOGY CANVAS
//  Root component. Composes the canvas + all UI overlays.
//  Deliberately thin — all logic lives in the engine + hook.
// ============================================================

import { useCallback } from 'react';
import { useTopology } from '@/hooks/useTopology.js';
import { HUD, Controls, ArrowLegend } from './hud/index.jsx';
import { InfoPanel } from './panels/InfoPanel.jsx';

/**
 * @param {{
 *   config:     object|null,
 *   onSelect?:  (el: object|null) => void,
 *   className?: string,
 *   style?:     object,
 * }} props
 */
export function TopologyCanvas({ config, onSelect, className, style }) {
  const {
    canvasRef,
    engine,
    selected,
    hovered,
    zoomPct,
    elemCount,
  } = useTopology({ config, onSelect });

  const handleClose = useCallback(() => engine.clearSelection(), [engine]);

  return (
    <div
      className={className}
      style={{
        position:   'relative',
        width:      '100%',
        height:     '100%',
        background: '#0d1b2a',
        overflow:   'hidden',
        ...style,
      }}
    >
      {/* Canvas — fills the container */}
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />

      {/* Fixed overlays */}
      <HUD        elemCount={elemCount} selected={selected} hovered={hovered} />
      <Controls   engine={engine} zoomPct={zoomPct} />
      <ArrowLegend />
      <InfoPanel  element={selected} onClose={handleClose} />
    </div>
  );
}
