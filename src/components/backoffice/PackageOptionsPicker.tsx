"use client";

import { useState, useEffect, useCallback } from "react";
import OptionsPanel from "./OptionsPanel";

type PkgRow = { id: string; name: string; translations: { lang: string; title: string }[] };

type Props = {
  boatId: string;
  boatName: string;
  onClose: () => void;
  label?: string;
};

export default function PackageOptionsPicker({ boatId, boatName, onClose, label = "Package" }: Props) {
  const [packages, setPackages] = useState<PkgRow[]>([]);
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(null);

  const load = useCallback(async () => {
    const data = await fetch(`/api/packages?boatId=${boatId}`).then(r => r.json()).catch(() => []);
    setPackages(Array.isArray(data) ? data : []);
  }, [boatId]);

  useEffect(() => { load(); }, [load]);

  if (selected) {
    return (
      <OptionsPanel
        packageId={selected.id}
        packageName={selected.name}
        onClose={() => setSelected(null)}
      />
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)" }} />
      <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "min(360px, 100vw)", background: "#0d0d0d", borderLeft: "1px solid #1a1a1a", display: "flex", flexDirection: "column", zIndex: 1 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", borderBottom: "1px solid #1a1a1a", flexShrink: 0 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#ccc" }}>Options</div>
            <div style={{ fontSize: 10, color: "#555", marginTop: 1 }}>เลือก {label}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 20, padding: "0 4px", lineHeight: 1 }}>✕</button>
        </div>

        {/* Package list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 18px", display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 11, color: "#333", marginBottom: 4 }}>{boatName}</div>
          {packages.length === 0 && (
            <div style={{ fontSize: 12, color: "#2a2a2a", textAlign: "center", marginTop: 40 }}>ยังไม่มี {label}</div>
          )}
          {packages.map(pkg => {
            const label = pkg.translations.find(t => t.lang === "en")?.title || pkg.name;
            return (
              <button
                key={pkg.id}
                onClick={() => setSelected({ id: pkg.id, name: label })}
                style={{ background: "#090909", border: "1px solid #1a1a1a", borderRadius: 8, padding: "10px 14px", textAlign: "left", cursor: "pointer", color: "#ccc", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "space-between" }}
              >
                {label}
                <span style={{ fontSize: 10, color: "#444" }}>›</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
