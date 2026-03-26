"use client";

// ============================================================
//  INFO PANEL
//  Fixed overlay showing the selected element's properties.
// ============================================================

const DIRECTION_DISPLAY = {
  from: { label: "→ FROM source", color: "#64c8ff" },
  to: { label: "← TO target", color: "#ff8c42" },
  bidirectional: { label: "↔ BIDIRECTIONAL", color: "#aaffcc" },
};

const TYPE_COLORS = {
  router: "#64c8ff",
  bridge: "#9999bb",
  connection: "#ff8c42",
  "connection-line": "#ff8c42",
};

// ── Sub-components ────────────────────────────────────────────

function PropRow({ label, value, color }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "3px 0",
        borderBottom: "1px solid rgba(100,200,255,0.06)",
        gap: 8,
      }}
    >
      <span
        style={{ color: "rgba(140,190,230,0.55)", fontSize: 10, flexShrink: 0 }}
      >
        {label}
      </span>
      <span
        title={String(value)}
        style={{
          color: color ?? "#8dd4ff",
          fontSize: 10,
          fontWeight: "bold",
          textAlign: "right",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          maxWidth: 155,
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ── Prop builders ─────────────────────────────────────────────

function RouterRows({ el }) {
  return (
    <>
      <PropRow label="id" value={el.id} />
      <PropRow label="label" value={el.label} />
      <PropRow label="x" value={Math.round(el.x)} />
      <PropRow label="y" value={Math.round(el.y)} />
      <PropRow label="radius" value={el.radius} />
      {Object.entries(el.meta).map(([k, v]) => (
        <PropRow key={k} label={k} value={String(v)} />
      ))}
    </>
  );
}

function BridgeRows({ el }) {
  return (
    <>
      <PropRow label="id" value={el.id} />
      <PropRow label="label" value={el.label} />
      <PropRow label="routerId" value={el.routerId} />
      <PropRow label="x" value={Math.round(el.x)} />
      <PropRow label="y" value={Math.round(el.y)} />
      <PropRow label="radius" value={el.radius} />
      {Object.entries(el.meta).map(([k, v]) => (
        <PropRow key={k} label={k} value={String(v)} />
      ))}
    </>
  );
}

function ConnectionLineRows({ el }) {
  const dir = DIRECTION_DISPLAY[el.direction] ?? DIRECTION_DISPLAY.from;
  return (
    <>
      <PropRow label="id" value={el.id} />
      <PropRow label="connectionId" value={el.connectionId} />
      <PropRow label="from" value={el.fromId} />
      <PropRow label="to" value={el.toId} />
      <PropRow label="direction" value={dir.label} color={dir.color} />
      <PropRow
        label="lineIndex"
        value={`${el.lineIndex + 1} / ${el.lineTotal}`}
      />
      <PropRow label="offset" value={el.offset.toFixed(1)} />
    </>
  );
}

function ConnectionRows({ el }) {
  const dir = DIRECTION_DISPLAY[el.direction] ?? DIRECTION_DISPLAY.from;
  return (
    <>
      <PropRow label="id" value={el.id} />
      <PropRow label="from" value={el.fromId} />
      <PropRow label="to" value={el.toId} />
      <PropRow label="direction" value={dir.label} color={dir.color} />
      <PropRow label="lines" value={el.lineCount} />
      {Object.entries(el.meta).map(([k, v]) => (
        <PropRow key={k} label={k} value={String(v)} />
      ))}
    </>
  );
}

// ── Main component ────────────────────────────────────────────

/**
 * @param {{ element: object|null, onClose: () => void }} props
 */
export function InfoPanel({ element, onClose }) {
  if (!element) return null;

  const typeColor = TYPE_COLORS[element.type] ?? "#aaa";

  return (
    <div
      style={{
        position: "fixed",
        top: 16,
        right: 16,
        width: 252,
        background: "rgba(9, 18, 30, 0.94)",
        border: "1px solid rgba(100,200,255,0.18)",
        borderRadius: 8,
        padding: 14,
        backdropFilter: "blur(14px)",
        zIndex: 30,
        fontFamily: "'Courier New', monospace",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <span
          style={{
            fontSize: 9,
            fontWeight: "bold",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            padding: "2px 8px",
            borderRadius: 3,
            background: typeColor + "22",
            color: typeColor,
            border: `1px solid ${typeColor}44`,
          }}
        >
          {element.type}
        </span>
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            background: "none",
            border: "none",
            color: "rgba(100,200,255,0.5)",
            cursor: "pointer",
            fontSize: 18,
            lineHeight: 1,
            padding: "0 2px",
          }}
          onMouseEnter={(e) => (e.target.style.color = "#64c8ff")}
          onMouseLeave={(e) => (e.target.style.color = "rgba(100,200,255,0.5)")}
        >
          ×
        </button>
      </div>

      {/* Properties */}
      <div>
        {element.type === "router" && <RouterRows el={element} />}
        {element.type === "bridge" && <BridgeRows el={element} />}
        {element.type === "connection" && <ConnectionRows el={element} />}
        {element.type === "connection-line" && (
          <ConnectionLineRows el={element} />
        )}
      </div>
    </div>
  );
}
