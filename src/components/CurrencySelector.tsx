"use client";

import { useState } from "react";
import { useCurrency } from "@/components/CurrencyProvider";
import { currencyOptions, type DisplayCurrency } from "@/lib/currency";

// Compact currency picker. Writes the choice to the pref_currency cookie and
// refreshes so server components re-render prices in the new currency.
export default function CurrencySelector({ compact = false }: { compact?: boolean }) {
  const { currency, setCurrency } = useCurrency();
  const [open, setOpen] = useState(false);
  const opts = currencyOptions();

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Change currency"
        style={{
          display: "inline-flex", alignItems: "center", gap: 5, background: "transparent",
          border: "1px solid rgba(255,255,255,0.14)", borderRadius: 8, color: "#ccc",
          fontSize: compact ? 12 : 13, fontWeight: 700, padding: compact ? "5px 9px" : "7px 12px", cursor: "pointer",
        }}
      >
        <span>{currency}</span>
        <span style={{ fontSize: 9, opacity: 0.6 }}>▼</span>
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
          <div
            style={{
              // opens DOWNWARD — the picker now lives in the top navbar
              position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 41,
              background: "#141414", border: "1px solid #2a2a2a", borderRadius: 10, padding: 6,
              minWidth: 150, maxHeight: 320, overflowY: "auto", boxShadow: "0 12px 32px rgba(0,0,0,0.5)",
            }}
          >
            {opts.map(o => (
              <button
                key={o.code}
                onClick={() => { setCurrency(o.code as DisplayCurrency); setOpen(false); }}
                style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left",
                  background: o.code === currency ? "rgba(59,130,246,0.16)" : "transparent",
                  border: "none", borderRadius: 7, color: o.code === currency ? "#fff" : "#bbb",
                  fontSize: 13, padding: "9px 11px", cursor: "pointer",
                }}
              >
                <span style={{ fontWeight: 700, width: 40 }}>{o.code}</span>
                <span style={{ color: "#777", fontSize: 12 }}>{o.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
