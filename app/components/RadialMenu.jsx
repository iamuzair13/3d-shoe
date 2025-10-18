"use client";
import { useEffect, useState } from "react";

export default function RadialMenu({
  options,
  onSelect,
  onClose,
  title,
  isSwatchMenu = false,
}) {
  const [radius, setRadius] = useState(120);
  const [iconSize, setIconSize] = useState(55);
  const [fontSize, setFontSize] = useState(11);

  // ✅ Responsive scaling for smaller screens
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      if (w < 400) {
        setRadius(75);
        setIconSize(40);
        setFontSize(9);
      } else if (w < 768) {
        setRadius(95);
        setIconSize(48);
        setFontSize(10);
      } else {
        setRadius(120);
        setIconSize(55);
        setFontSize(11);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
        background: "rgba(136, 136, 136, 0.18)",
        boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
        zIndex: 10,
        backdropFilter: "blur(5px)",
      }}
    >
      {/* Title */}
      <div
        style={{
          position: "absolute",
          fontWeight: "bold",
          color: "white",
          textShadow: "0 1px 3px rgba(0,0,0,0.5)",
          textAlign: "center",
          fontSize: fontSize + 2,
          width: "100px",
          lineHeight: "1.2em",
        }}
      >
        {title}
      </div>

      {/* Circular Options */}
      {options.map((opt, i) => {
        const angle = (i / itemCount) * 2 * Math.PI;
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);

        const itemStyle = {
          position: "absolute",
          top: `calc(50% + ${y}px)`,
          left: `calc(50% + ${x}px)`,
          transform: "translate(-50%, -50%)",
          textAlign: "center",
          cursor: "pointer",
        };

        if (isSwatchMenu) {
          return (
            <img
              key={opt.url || i}
              src={opt.url}
              alt={opt.label}
              width={iconSize}
              height={iconSize}
              style={{
                ...itemStyle,
                borderRadius: "50%",
                border: "3px solid #eee",
                boxShadow: "0 2px 5px rgba(0,0,0,0.3)",
              }}
              onClick={() => onSelect(opt)}
            />
          );
        }

        return (
          <div
            key={opt.type || i}
            style={{
              ...itemStyle,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "6px",
            }}
            onClick={() => onSelect(opt)}
          >
            <img
              src={opt.colors[0]?.url}
              alt={opt.label}
              width={iconSize}
              height={iconSize}
              style={{
                borderRadius: "50%",
                border: "3px solid #eee",
                boxShadow: "0 2px 5px rgba(0,0,0,0.3)",
              }}
            />
            <span
              style={{
                background: "rgba(0,0,0,0.6)",
                color: "white",
                fontSize: fontSize,
                padding: "2px 6px",
                borderRadius: "8px",
                whiteSpace: "nowrap",
              }}
            >
              {opt.label}
            </span>
          </div>
        );
      })}

      {/* Close Button */}
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          bottom: "-60px",
          padding: "12px 20px",
          background: "#0e0d0d58",
          color: "white",
          borderRadius: "50%",
          cursor: "pointer",
          fontSize: "18px",
          transition: "transform 0.2s ease",
        }}
      >
        X
      </div>
    </div>
  );
}
