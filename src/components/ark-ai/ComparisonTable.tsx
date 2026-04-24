"use client";

type Boat = {
  title: string;
  price: number;
  type: string;
  area: string;
  capacity: number | null;
  slug: string;
};

export default function ComparisonTable({ boats }: { boats: Boat[] }) {
  if (!boats.length) return null;

  const headers = ["", ...boats.map(b => b.title)];
  const rows = [
    ["Type", ...boats.map(b => b.type.replace("_", " "))],
    ["Area", ...boats.map(b => b.area || "-")],
    ["Capacity", ...boats.map(b => b.capacity ? `${b.capacity} pax` : "-")],
  ];

  return (
    <div style={{ margin: "8px 0", overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, background: "#161616", borderRadius: 10, overflow: "hidden" }}>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} style={{ padding: "10px 12px", textAlign: i === 0 ? "left" : "center", color: i === 0 ? "#666" : "#60a5fa", fontWeight: 700, borderBottom: "1px solid #262626", fontSize: 13 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td key={ci} style={{ padding: "8px 12px", textAlign: ci === 0 ? "left" : "center", color: ci === 0 ? "#888" : "#ccc", borderBottom: ri < rows.length - 1 ? "1px solid #1f1f1f" : "none", fontSize: 13 }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
