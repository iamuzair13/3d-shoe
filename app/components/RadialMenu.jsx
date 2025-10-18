// RadialMenu.jsx
"use client";

export default function RadialMenu({
  options,
  onSelect,
  onClose,
  title,
  isSwatchMenu = false,
}) {
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
        background: "rgba(136, 136, 136, 0.18)",
        boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
        zIndex: 10,
      }}
    >
      {/* Title in center */}
      <div
        style={{
          position: "absolute",
          fontWeight: "bold",
          color: "white",
          textShadow: "0 1px 3px rgba(0,0,0,0.5)",
          textAlign: "center",
        }}
      >
        {title}
      </div>

      {/* Circular options */}
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

        // ✅ Color Swatch Menu (2nd step)
        if (isSwatchMenu) {
          return (
            <img
              key={opt.url || i} // Use url as key, fallback to index
              src={opt.url}
              alt={opt.label}
              width="55"
              height="55"
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

        // ✅ Leather Type Menu (1st step)
        return (
          <div
            key={opt.type || i} // Safer key using type, fallback to index
            style={{
              ...itemStyle,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "6px",
            }}
            onClick={() => onSelect(opt)}
          >
            {/* Preview = first shade */}
            <img
              src={opt.colors[0]?.url}
              alt={opt.label}
              width="55"
              height="55"
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
                fontSize: "11px",
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
          bottom: "-65px",
          padding: "15px 25px",
          background: "#0e0d0d58",
          color: "white",
          borderRadius: "50%",
          cursor: "pointer",
          fontSize: "18px",
        }}
      >
        X
      </div>
    </div>
  );
}