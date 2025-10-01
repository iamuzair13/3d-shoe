// RadialMenu.jsx
"use client";
import { useEffect, useState } from "react";

export default function RadialMenu({ options, onSelect, onClose, selectedPart }) {
  const radius = 120; // circle radius
  const itemCount = options.length;

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        width: `${radius * 2 + 80}px`,
        height: `${radius * 2 + 80}px`,
        transform: "translate(-50%, -50%)",
        borderRadius: "50%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "rgba(136, 136, 136, 0.85)",
        boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
      }}
    >
      {/* Title in center */}
      <div style={{ position: "absolute", fontWeight: "bold" }}>{selectedPart}</div>

      {/* Circular swatches */}
      {options.map((opt, i) => {
        const angle = (i / itemCount) * 2 * Math.PI; // evenly spaced
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);

        return (
          <img
            key={opt.url}
            src={opt.url}
            alt={opt.label}
            width="55"
            height="55"
            style={{
              position: "absolute",
              top: `calc(50% + ${y}px - 25px)`,
              left: `calc(50% + ${x}px - 25px)`,
              borderRadius: "50%",
              border: "2px solid #333",
              cursor: "pointer",
            }}
            onClick={() => onSelect(opt.url)}
          />
        );
      })}

     
    </div>
  );
}
