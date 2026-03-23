'use client';

// ============================================================
//  HUD COMPONENTS
//  All fixed-position overlays: stats strip, zoom controls,
//  and arrow-direction legend. Pure React — no canvas.
// ============================================================

/** Shared surface style */
const SURFACE = {
  background:     'rgba(9, 18, 30, 0.90)',
  border:         '1px solid rgba(100,200,255,0.18)',
  backdropFilter: 'blur(10px)',
  fontFamily:     "'Courier New', monospace",
};

// ── HUD — top-left stats strip ────────────────────────────────

/**
 * @param {{ elemCount: number, selected: object|null, hovered: object|null }} props
 */
export function HUD({ elemCount, selected, hovered }) {
  const active = hovered ?? selected;

  return (
    <div style={{
      position:      'fixed',
      top:           16,
      left:          16,
      display:       'flex',
      flexDirection: 'column',
      gap:           6,
      zIndex:        20,
      pointerEvents: 'none',
    }}>
      <HudPill>ELEMENTS: {elemCount}</HudPill>
      <HudPill highlight={!!active}>
        {active
          ? `${active.type.toUpperCase()}: ${active.id}`
          : 'HOVER OR CLICK TO SELECT'}
      </HudPill>
    </div>
  );
}

function HudPill({ children, highlight }) {
  return (
    <div style={{
      ...SURFACE,
      color:       highlight ? '#64c8ff' : 'rgba(100,200,255,0.6)',
      borderColor: highlight ? 'rgba(100,200,255,0.4)' : 'rgba(100,200,255,0.18)',
      padding:       '5px 12px',
      fontSize:      11,
      letterSpacing: '0.07em',
      borderRadius:  4,
      whiteSpace:    'nowrap',
    }}>
      {children}
    </div>
  );
}

// ── Controls — bottom-right ───────────────────────────────────

/**
 * @param {{ engine: object, zoomPct: number }} props
 */
export function Controls({ engine, zoomPct }) {
  const buttons = [
    { label: '+', title: 'Zoom In',       action: () => engine.zoomIn()      },
    { label: '−', title: 'Zoom Out',      action: () => engine.zoomOut()     },
    { label: '⊡', title: 'Fit to Screen', action: () => engine.fitToScreen() },
    { label: '↺', title: 'Reset View',    action: () => engine.resetView()   },
  ];

  return (
    <>
      <div style={{
        position:      'fixed',
        bottom:        22,
        right:         18,
        display:       'flex',
        flexDirection: 'column',
        gap:           5,
        zIndex:        20,
      }}>
        {buttons.map(b => (
          <CtrlBtn key={b.label} title={b.title} onClick={b.action}>
            {b.label}
          </CtrlBtn>
        ))}
      </div>

      {/* Zoom percentage label */}
      <div style={{
        ...SURFACE,
        position:      'fixed',
        bottom:        24,
        left:          16,
        padding:       '4px 10px',
        fontSize:      11,
        letterSpacing: '0.06em',
        borderRadius:  4,
        color:         'rgba(100,200,255,0.5)',
        pointerEvents: 'none',
        zIndex:        20,
      }}>
        ZOOM: {zoomPct}%
      </div>
    </>
  );
}

function CtrlBtn({ children, title, onClick }) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        ...SURFACE,
        width:          36,
        height:         36,
        color:          'rgba(100,200,255,0.9)',
        fontSize:       17,
        cursor:         'pointer',
        borderRadius:   6,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        fontFamily:     'system-ui',
        transition:     'background 0.12s, border-color 0.12s, color 0.12s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background   = 'rgba(100,200,255,0.14)';
        e.currentTarget.style.borderColor  = 'rgba(100,200,255,0.5)';
        e.currentTarget.style.color        = '#ffffff';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background   = 'rgba(9, 18, 30, 0.90)';
        e.currentTarget.style.borderColor  = 'rgba(100,200,255,0.18)';
        e.currentTarget.style.color        = 'rgba(100,200,255,0.9)';
      }}
    >
      {children}
    </button>
  );
}

// ── Arrow direction legend — bottom-center ────────────────────

export function ArrowLegend() {
  const items = [
    { color: '#64c8ff', label: 'FROM →'  },
    { color: '#ff8c42', label: '← TO'    },
    { color: '#aaffcc', label: '↔ BOTH'  },
  ];

  return (
    <div style={{
      ...SURFACE,
      position:      'fixed',
      bottom:        24,
      left:          '50%',
      transform:     'translateX(-50%)',
      borderRadius:  20,
      padding:       '6px 18px',
      display:       'flex',
      gap:           22,
      alignItems:    'center',
      zIndex:        20,
      pointerEvents: 'none',
    }}>
      {items.map(item => (
        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 26, height: 2, background: item.color, borderRadius: 1 }} />
          <span style={{ fontSize: 10, color: item.color, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}
