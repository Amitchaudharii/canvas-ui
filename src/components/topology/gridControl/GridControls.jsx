import React, { useEffect, useState } from "react";
import GridSpinner from "./GridSpinner";

const MIN_VAL = 1;
const MAX_VAL = 20;

const SURFACE = {
  background: "rgba(9, 18, 30, 0.92)",
  border: "1px solid rgba(100,200,255,0.18)",
  backdropFilter: "blur(12px)",
  fontFamily: "'Courier New', monospace",
};

const GridControls = ({ rows, cols, loading, onApply }) => {
  const [localRows, setLocalRows] = useState(rows);
  const [localCols, setLocalCols] = useState(cols);

  // Keep local state in sync if parent resets
  useEffect(() => {
    setLocalRows(rows);
  }, [rows]);
  useEffect(() => {
    setLocalCols(cols);
  }, [cols]);

  const clamp = (v) =>
    Math.max(MIN_VAL, Math.min(MAX_VAL, Number(v) || MIN_VAL));

  const handleApply = () => onApply(clamp(localRows), clamp(localCols));

  const handleKey = (e) => {
    if (e.key === "Enter") handleApply();
  };

  return (
    <div
      style={{
        ...SURFACE,
        position: "fixed",
        top: 16,
        left: "50%",
        transform: "translateX(-50%)",
        borderRadius: 8,
        padding: "10px 14px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        zIndex: 30,
        boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
        userSelect: "none",
      }}
    >
      {/* Label */}
      <span
        style={{
          fontSize: 10,
          color: "rgba(100,200,255,0.5)",
          letterSpacing: "0.1em",
        }}
      >
        GRID
      </span>

      {/* Rows */}
      <GridSpinner
        label="ROWS"
        value={localRows}
        onChange={setLocalRows}
        onKey={handleKey}
        min={MIN_VAL}
        max={MAX_VAL}
      />

      <span style={{ color: "rgba(100,200,255,0.3)", fontSize: 14 }}>×</span>

      {/* Cols */}
      <GridSpinner
        label="COLS"
        value={localCols}
        onChange={setLocalCols}
        onKey={handleKey}
        min={MIN_VAL}
        max={MAX_VAL}
      />

      {/* Apply button */}
      <button
        onClick={handleApply}
        disabled={loading}
        style={{
          ...SURFACE,
          padding: "5px 14px",
          fontSize: 10,
          fontWeight: "bold",
          letterSpacing: "0.1em",
          borderRadius: 5,
          cursor: loading ? "not-allowed" : "pointer",
          color: loading ? "rgba(100,200,255,0.35)" : "#64c8ff",
          borderColor: loading
            ? "rgba(100,200,255,0.1)"
            : "rgba(100,200,255,0.35)",
          transition: "background 0.12s, color 0.12s, border-color 0.12s",
          minWidth: 60,
          textAlign: "center",
        }}
        onMouseEnter={(e) => {
          if (!loading) {
            e.currentTarget.style.background = "rgba(100,200,255,0.12)";
            e.currentTarget.style.borderColor = "rgba(100,200,255,0.6)";
            e.currentTarget.style.color = "#ffffff";
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(9, 18, 30, 0.92)";
          e.currentTarget.style.borderColor = loading
            ? "rgba(100,200,255,0.1)"
            : "rgba(100,200,255,0.35)";
          e.currentTarget.style.color = loading
            ? "rgba(100,200,255,0.35)"
            : "#64c8ff";
        }}
      >
        {loading ? "···" : "APPLY"}
      </button>
    </div>
  );
};

export default GridControls;
