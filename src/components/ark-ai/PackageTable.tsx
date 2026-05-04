"use client";

type PackageItem = {
  title: string;
  excerpt: string;
  recommended?: boolean;
  isFull?: boolean;
};

type Props = {
  boatTitle: string;
  scheduleDate?: string;
  packages: PackageItem[];
  selectedName?: string;
  onSelectPackage?: (title: string) => void;
};

export default function PackageTable({ boatTitle, scheduleDate, packages, selectedName, onSelectPackage }: Props) {
  if (!packages.length) return null;

  return (
    <div style={{
      margin: "4px 0 2px",
      background: "#0d1117",
      border: "1px solid #1e2d40",
      borderRadius: 12,
      overflow: "hidden",
    }}>
      <div style={{
        padding: "10px 14px 8px",
        borderBottom: "1px solid #1e2d40",
      }}>
        <p style={{ fontSize: 11, color: "#60a5fa", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
          Available Packages
        </p>
        <p style={{ fontSize: 13, color: "#e5e5e5", fontWeight: 600, margin: "2px 0 0" }}>
          {boatTitle}{scheduleDate ? ` · ${scheduleDate}` : ""}
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {packages.map((pkg, i) => {
          const isSelected = !!selectedName && selectedName === pkg.title;
          const interactive = !!onSelectPackage && !pkg.isFull;
          return (
            <button
              key={i}
              type="button"
              onClick={interactive ? () => onSelectPackage!(pkg.title) : undefined}
              disabled={!interactive}
              style={{
                textAlign: "left",
                width: "100%",
                padding: "10px 14px",
                background: isSelected
                  ? "rgba(96,165,250,0.18)"
                  : pkg.recommended ? "rgba(96,165,250,0.08)" : "transparent",
                border: "none",
                borderLeft: isSelected
                  ? "3px solid #60a5fa"
                  : pkg.recommended ? "3px solid #60a5fa" : "3px solid transparent",
                opacity: pkg.isFull ? 0.45 : 1,
                cursor: interactive ? "pointer" : "default",
                color: "#e5e5e5",
                fontFamily: "inherit",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{
                  fontSize: 14, fontWeight: 700,
                  color: pkg.recommended || isSelected ? "#60a5fa" : "#e5e5e5",
                }}>
                  {pkg.title}
                </span>
                {pkg.recommended && !isSelected && (
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    color: "#60a5fa", background: "rgba(96,165,250,0.15)",
                    padding: "1px 6px", borderRadius: 4,
                    textTransform: "uppercase", letterSpacing: "0.05em",
                  }}>
                    Recommended
                  </span>
                )}
                {isSelected && (
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    color: "#fff", background: "#1e40af",
                    padding: "1px 6px", borderRadius: 4,
                    textTransform: "uppercase", letterSpacing: "0.05em",
                  }}>
                    ✓ Selected
                  </span>
                )}
                {pkg.isFull && (
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    color: "#ef4444", background: "rgba(239,68,68,0.15)",
                    padding: "1px 6px", borderRadius: 4,
                    textTransform: "uppercase",
                  }}>
                    Full
                  </span>
                )}
              </div>
              {pkg.excerpt && (
                <p style={{
                  fontSize: 12.5, color: "#999", lineHeight: 1.5,
                  margin: "4px 0 0",
                }}>
                  {pkg.excerpt}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
