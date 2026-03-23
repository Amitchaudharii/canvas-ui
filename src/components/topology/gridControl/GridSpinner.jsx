import React from "react";

const GridSpinner = ({ label, value, onChange, onKey, min, max }) => {
  const dec = () => onChange((v) => Math.max(min, v - 1));
  const inc = () => onChange((v) => Math.min(max, v + 1));

  const stepBtn = (symbol, action) => (
    <button
      onClick={action}
      style={{
        background: "none",
        border: "none",
        color: "rgba(100,200,255,0.55)",
        cursor: "pointer",
        fontSize: 14,
        lineHeight: 1,
        padding: "0 3px",
        display: "flex",
        alignItems: "center",
        transition: "color 0.1s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.color = "#64c8ff")}
      onMouseLeave={(e) =>
        (e.currentTarget.style.color = "rgba(100,200,255,0.55)")
      }
    >
      {symbol}
    </button>
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1,
      }}
    >
      <span
        style={{
          fontSize: 8,
          color: "rgba(100,200,255,0.4)",
          letterSpacing: "0.1em",
        }}
      >
        {label}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
        {stepBtn("−", dec)}
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          onChange={(e) => onChange(Number(e.target.value))}
          onKeyDown={onKey}
          style={{
            width: 36,
            background: "rgba(100,200,255,0.07)",
            border: "1px solid rgba(100,200,255,0.2)",
            borderRadius: 4,
            color: "#a0e0ff",
            fontSize: 13,
            fontWeight: "bold",
            fontFamily: "'Courier New', monospace",
            textAlign: "center",
            padding: "3px 0",
            outline: "none",
            MozAppearance: "textfield",
            WebkitAppearance: "none",
          }}
        />
        {stepBtn("+", inc)}
      </div>
    </div>
  );
};

export default GridSpinner;
