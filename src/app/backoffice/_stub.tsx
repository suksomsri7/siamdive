// shared stub component
export function ComingSoon({ title, desc }: { title: string; desc?: string }) {
  return (
    <div style={{ padding: "20px 16px", color: "#e5e5e5" }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>{title}</h1>
      <p style={{ fontSize: 13, color: "#444", marginBottom: 32 }}>{desc ?? "จัดการข้อมูลในส่วนนี้"}</p>
      <div style={{ background: "#161616", border: "1px dashed rgba(255,255,255,0.08)", borderRadius: 14, padding: "60px 40px", textAlign: "center" }}>
        <p style={{ fontSize: 32, marginBottom: 12 }}>🚧</p>
        <p style={{ fontSize: 14, color: "#333", fontWeight: 600 }}>Coming soon</p>
        <p style={{ fontSize: 12, color: "#2a2a2a", marginTop: 6 }}>หน้านี้อยู่ระหว่างพัฒนา</p>
      </div>
    </div>
  );
}
