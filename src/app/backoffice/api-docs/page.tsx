"use client";

import { useState } from "react";

// ── Data ───────────────────────────────────────────────────────────────────────
const BASE = "https://siamdive.com/api";

const SECTIONS = [
  {
    group: "🤿 ทริปดำน้ำ",
    desc: "จัดการเรือ, ตาราง, และแพ็กเกจทัวร์ดำน้ำทุกประเภท",
    endpoints: [
      {
        resource: "Boats / เรือ-ทัวร์",
        perm: "daytrip | snorkeling | land-tour | liveaboard | dive-resort | dive-center | freedive",
        routes: [
          { method:"GET",    path:"/boats",          perm:"*.read",   desc:"รายการเรือทั้งหมด รองรับ ?type=DAYTRIP|LIVEABOARD|... และ ?companyId=" },
          { method:"POST",   path:"/boats",          perm:"*.write",  desc:"สร้างเรือใหม่" },
          { method:"GET",    path:"/boats/:id",      perm:"*.read",   desc:"รายละเอียดเรือ" },
          { method:"PUT",    path:"/boats/:id",      perm:"*.write",  desc:"แก้ไขเรือ" },
          { method:"DELETE", path:"/boats/:id",      perm:"*.delete", desc:"ลบเรือ" },
        ],
      },
      {
        resource: "Schedules / ตาราง",
        perm: "daytrip | snorkeling | land-tour | liveaboard | dive-resort | dive-center | freedive",
        routes: [
          { method:"GET",    path:"/schedules",      perm:"*.read",   desc:"รายการ Schedule รองรับ ?boatId=" },
          { method:"POST",   path:"/schedules",      perm:"*.write",  desc:"สร้าง Schedule ใหม่ — packages[]: { packageId, availableSeats?, isFull? }" },
          { method:"GET",    path:"/schedules/:id",  perm:"*.read",   desc:"รายละเอียด Schedule" },
          { method:"PUT",    path:"/schedules/:id",  perm:"*.write",  desc:"แก้ไข Schedule — packages[]: { packageId, availableSeats?, isFull? }" },
          { method:"DELETE", path:"/schedules/:id",  perm:"*.delete", desc:"ลบ Schedule" },
        ],
      },
      {
        resource: "Packages / แพ็กเกจ",
        perm: "daytrip | snorkeling | land-tour | liveaboard | dive-resort | dive-center | freedive",
        routes: [
          { method:"GET",    path:"/packages",       perm:"*.read",   desc:"รายการ Package รองรับ ?boatId=" },
          { method:"POST",   path:"/packages",       perm:"*.write",  desc:"สร้าง Package ใหม่" },
          { method:"GET",    path:"/packages/:id",   perm:"*.read",   desc:"รายละเอียด Package" },
          { method:"PUT",    path:"/packages/:id",   perm:"*.write",  desc:"แก้ไข Package" },
          { method:"DELETE", path:"/packages/:id",   perm:"*.delete", desc:"ลบ Package" },
        ],
      },
    ],
  },
  {
    group: "🎓 คอร์สดำน้ำ",
    desc: "Scuba Courses และ Freedive Courses พร้อม Dive Centers",
    endpoints: [
      {
        resource: "Schools / Dive Centers",
        perm: "scuba-courses | freedive-courses",
        routes: [
          { method:"GET",    path:"/schools",        perm:"*.read",   desc:"รายการ Dive Centers / Schools" },
          { method:"POST",   path:"/schools",        perm:"*.write",  desc:"สร้าง Dive Center ใหม่" },
          { method:"GET",    path:"/schools/:id",    perm:"*.read",   desc:"รายละเอียด Dive Center" },
          { method:"PUT",    path:"/schools/:id",    perm:"*.write",  desc:"แก้ไข Dive Center" },
          { method:"DELETE", path:"/schools/:id",    perm:"*.delete", desc:"ลบ Dive Center" },
        ],
      },
      {
        resource: "Courses",
        perm: "scuba-courses | freedive-courses",
        routes: [
          { method:"GET",    path:"/courses",        perm:"*.read",   desc:"รายการ Courses รองรับ ?schoolId=" },
          { method:"POST",   path:"/courses",        perm:"*.write",  desc:"สร้าง Course ใหม่" },
          { method:"GET",    path:"/courses/:id",    perm:"*.read",   desc:"รายละเอียด Course" },
          { method:"PUT",    path:"/courses/:id",    perm:"*.write",  desc:"แก้ไข Course" },
          { method:"DELETE", path:"/courses/:id",    perm:"*.delete", desc:"ลบ Course" },
        ],
      },
    ],
  },
  {
    group: "🏢 ข้อมูลส่วนกลาง",
    desc: "บริษัท และจุดดำน้ำที่ใช้ร่วมกันทุกประเภททริป",
    endpoints: [
      {
        resource: "Companies",
        perm: "companies",
        routes: [
          { method:"GET",    path:"/companies",      perm:"companies.read",   desc:"รายการบริษัท" },
          { method:"POST",   path:"/companies",      perm:"companies.write",  desc:"สร้างบริษัทใหม่" },
          { method:"PUT",    path:"/companies/:id",  perm:"companies.write",  desc:"แก้ไขบริษัท" },
          { method:"DELETE", path:"/companies/:id",  perm:"companies.delete", desc:"ลบบริษัท" },
        ],
      },
      {
        resource: "Countries / ประเทศ",
        perm: "countries",
        routes: [
          { method:"GET",    path:"/countries",      perm:"countries.read",   desc:"รายการประเทศ (code, flag, ชื่อ 8 ภาษา)" },
          { method:"POST",   path:"/countries",      perm:"countries.write",  desc:"สร้างประเทศใหม่ (body: code, flag, order, status, translations[])" },
          { method:"PUT",    path:"/countries/:id",  perm:"countries.write",  desc:"แก้ไขประเทศ" },
          { method:"DELETE", path:"/countries/:id",  perm:"countries.delete", desc:"ลบประเทศ (ลบไม่ได้ถ้ายังมี ServiceArea อยู่ใต้)" },
        ],
      },
      {
        resource: "Service Areas / จุดดำน้ำ",
        perm: "service-areas",
        routes: [
          { method:"GET",    path:"/service-areas",      perm:"service-areas.read",   desc:"รายการจุดดำน้ำ (response: countryId + nested country)" },
          { method:"POST",   path:"/service-areas",      perm:"service-areas.write",  desc:"สร้างจุดดำน้ำใหม่ — ต้องส่ง countryId เพื่อผูกประเทศ" },
          { method:"PUT",    path:"/service-areas/:id",  perm:"service-areas.write",  desc:"แก้ไขจุดดำน้ำ / ย้ายประเทศ (ส่ง countryId)" },
          { method:"DELETE", path:"/service-areas/:id",  perm:"service-areas.delete", desc:"ลบจุดดำน้ำ" },
        ],
      },
    ],
  },
  {
    group: "📝 คอนเทนต์",
    desc: "บทความบล็อกและไฟล์มีเดีย",
    endpoints: [
      {
        resource: "Blogs",
        perm: "blogs",
        routes: [
          { method:"GET",    path:"/blogs",          perm:"blogs.read",   desc:"รายการบล็อก" },
          { method:"POST",   path:"/blogs",          perm:"blogs.write",  desc:"สร้างบล็อกใหม่" },
          { method:"PUT",    path:"/blogs/:id",      perm:"blogs.write",  desc:"แก้ไขบล็อก" },
          { method:"DELETE", path:"/blogs/:id",      perm:"blogs.delete", desc:"ลบบล็อก" },
        ],
      },
      {
        resource: "Media / Upload",
        perm: "upload",
        routes: [
          { method:"POST", path:"/upload", perm:"upload.write", desc:"อัปโหลดไฟล์ภาพ (multipart/form-data, field: file) → returns { url: string }" },
        ],
      },
    ],
  },
  {
    group: "⚙️ ระบบ",
    desc: "Display rows, Admin และ API Key management",
    endpoints: [
      {
        resource: "Display Rows",
        perm: "display-rows",
        routes: [
          { method:"GET",    path:"/display-rows",       perm:"display-rows.read",   desc:"รายการ rows พร้อม items" },
          { method:"POST",   path:"/display-rows",       perm:"display-rows.write",  desc:"สร้าง row ใหม่" },
          { method:"PUT",    path:"/display-rows/:id",   perm:"display-rows.write",  desc:"แก้ไข row (replace items)" },
          { method:"PATCH",  path:"/display-rows/:id",   perm:"display-rows.write",  desc:"อัปเดต row บางส่วน (active/order)" },
          { method:"DELETE", path:"/display-rows/:id",   perm:"display-rows.delete", desc:"ลบ row" },
        ],
      },
      {
        resource: "Admins",
        perm: "admins",
        routes: [
          { method:"GET",    path:"/admins",         perm:"admins.read",   desc:"รายการ Admin (ไม่มี password)" },
          { method:"POST",   path:"/admins",         perm:"admins.write",  desc:"สร้าง Admin ใหม่" },
          { method:"PUT",    path:"/admins/:id",     perm:"admins.write",  desc:"แก้ไข Admin" },
          { method:"DELETE", path:"/admins/:id",     perm:"admins.delete", desc:"ลบ Admin" },
        ],
      },
      {
        resource: "API Keys",
        perm: "api-keys",
        routes: [
          { method:"GET",    path:"/api-keys",       perm:"api-keys.read",   desc:"รายการ API Keys (ไม่แสดง key จริง)" },
          { method:"POST",   path:"/api-keys",       perm:"api-keys.write",  desc:"สร้าง API Key ใหม่" },
          { method:"PATCH",  path:"/api-keys/:id",   perm:"api-keys.write",  desc:"แก้ไข API Key" },
          { method:"DELETE", path:"/api-keys/:id",   perm:"api-keys.delete", desc:"ลบ API Key" },
        ],
      },
    ],
  },
] as const;

const METHOD_STYLE: Record<string, { bg: string; color: string }> = {
  GET:    { bg: "#0d2a17", color: "#4ade80" },
  POST:   { bg: "#0a1f3a", color: "#60a5fa" },
  PUT:    { bg: "#2a1a00", color: "#fbbf24" },
  PATCH:  { bg: "#1a0d2a", color: "#a78bfa" },
  DELETE: { bg: "#2a0a0a", color: "#f87171" },
};

// ── Component ──────────────────────────────────────────────────────────────────
export default function ApiDocsPage() {
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  const copyPath = async (path: string) => {
    const text = BASE + path;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement("textarea");
      el.value = text;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopiedPath(path); setTimeout(() => setCopiedPath(null), 1500);
  };

  const h2: React.CSSProperties = { margin:"0 0 4px", fontSize:16, fontWeight:700, color:"#e5e5e5" };
  const mono: React.CSSProperties = { fontFamily:"monospace", fontSize:12 };

  return (
    <div style={{ padding:"28px 24px", maxWidth:900 }}>

      {/* Header */}
      <div style={{ marginBottom:32 }}>
        <h1 style={{ margin:"0 0 6px", fontSize:22, fontWeight:800, color:"#e5e5e5" }}>📖 API Manual</h1>
        <p style={{ margin:"0 0 16px", fontSize:13, color:"#555" }}>SiamDive REST API — Base URL: <code style={{ ...mono, color:"#a3e635", background:"#111", padding:"2px 8px", borderRadius:5 }}>{BASE}</code></p>

        {/* Auth box */}
        <div style={{ background:"#0d0d0d", border:"1px solid #1a1a1a", borderRadius:12, padding:"16px 20px" }}>
          <div style={{ fontSize:12, fontWeight:700, color:"#888", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10 }}>Authentication</div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            <div style={{ fontSize:12, color:"#555" }}>ส่ง API Key ผ่าน Header ทุก request:</div>
            <code style={{ ...mono, background:"#111", border:"1px solid #1a1a1a", borderRadius:8, padding:"10px 14px", color:"#a3e635", display:"block" }}>
              X-API-Key: sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
            </code>
            <div style={{ fontSize:11, color:"#333" }}>
              หรือ Authorization: Bearer sk_xxxxxxxx...
            </div>
          </div>
        </div>
      </div>

      {/* Response format */}
      <div style={{ background:"#0d0d0d", border:"1px solid #1a1a1a", borderRadius:12, padding:"16px 20px", marginBottom:28 }}>
        <div style={{ fontSize:12, fontWeight:700, color:"#888", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10 }}>Response Format</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          {[
            { label:"✅ Success", code:`{ "data": {...} }  // หรือ array`, color:"#4ade80" },
            { label:"❌ Error", code:`{ "error": "message", "code": 403 }`, color:"#f87171" },
          ].map(r => (
            <div key={r.label}>
              <div style={{ fontSize:11, color:r.color, marginBottom:6, fontWeight:700 }}>{r.label}</div>
              <code style={{ ...mono, background:"#111", border:"1px solid #1a1a1a", borderRadius:7, padding:"8px 12px", color:"#888", display:"block", fontSize:11 }}>{r.code}</code>
            </div>
          ))}
        </div>
      </div>

      {/* Sections */}
      {SECTIONS.map(section => (
        <div key={section.group} style={{ marginBottom:36 }}>
          <div style={{ marginBottom:16 }}>
            <h2 style={h2}>{section.group}</h2>
            <p style={{ margin:0, fontSize:12, color:"#333" }}>{section.desc}</p>
          </div>

          {section.endpoints.map(ep => (
            <div key={ep.resource} style={{ marginBottom:14 }}>
              {/* Resource header */}
              <div style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 14px", background:"#111", borderRadius:"8px 8px 0 0", borderBottom:"1px solid #1a1a1a" }}>
                <span style={{ fontSize:13, fontWeight:700, color:"#ccc" }}>{ep.resource}</span>
                <span style={{ fontSize:10, color:"#3b82f6", background:"#1e3a5f22", border:"1px solid #1e3a5f44", padding:"2px 8px", borderRadius:10, fontFamily:"monospace" }}>
                  perm: {ep.perm}
                </span>
              </div>

              {/* Routes */}
              {ep.routes.map((r, ri) => {
                const ms = METHOD_STYLE[r.method] ?? { bg:"#111", color:"#888" };
                const fullPath = BASE + r.path;
                const isCopied = copiedPath === r.path;
                const isLast = ri === ep.routes.length - 1;
                return (
                  <div key={r.path + r.method}
                    style={{ display:"grid", gridTemplateColumns:"64px 1fr auto auto", alignItems:"center", gap:10, padding:"9px 14px", background:"#0d0d0d", border:"1px solid #161616", borderTop:"none", borderRadius: isLast ? "0 0 8px 8px" : 0 }}>
                    <span style={{ ...mono, fontSize:11, fontWeight:800, color:ms.color, background:ms.bg, padding:"3px 7px", borderRadius:5, textAlign:"center" }}>
                      {r.method}
                    </span>
                    <div style={{ minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"baseline", gap:8, flexWrap:"wrap" }}>
                        <code style={{ ...mono, fontSize:12, color:"#888" }}>{r.path}</code>
                        <span style={{ fontSize:10, color:"#252525" }}>{r.desc}</span>
                      </div>
                    </div>
                    <span style={{ fontSize:10, color:"#252525", fontFamily:"monospace", whiteSpace:"nowrap" }}>{r.perm}</span>
                    <button onClick={() => copyPath(r.path)}
                      style={{ background:"none", border:"1px solid #1a1a1a", color:isCopied ? "#4ade80":"#333", borderRadius:5, padding:"4px 8px", fontSize:10, cursor:"pointer", whiteSpace:"nowrap", fontFamily:"monospace" }}>
                      {isCopied ? "✓ copied" : "copy url"}
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      ))}

      {/* Permission note */}
      <div style={{ background:"#0d0d0d", border:"1px solid #1a1a1a", borderRadius:12, padding:"16px 20px", marginTop:8 }}>
        <div style={{ fontSize:12, fontWeight:700, color:"#888", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10 }}>Permission Keys</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(220px,1fr))", gap:6 }}>
          {[
            "daytrip.read/write/delete",
            "snorkeling.read/write/delete",
            "land-tour.read/write/delete",
            "liveaboard.read/write/delete",
            "dive-resort.read/write/delete",
            "dive-center.read/write/delete",
            "freedive.read/write/delete",
            "scuba-courses.read/write/delete",
            "freedive-courses.read/write/delete",
            "companies.read/write/delete",
            "countries.read/write/delete",
            "service-areas.read/write/delete",
            "blogs.read/write/delete",
            "upload.write",
            "display-rows.read/write/delete",
            "admins.read/write/delete",
            "api-keys.read/write/delete",
          ].map(p => (
            <code key={p} style={{ ...mono, fontSize:11, color:"#444", background:"#111", padding:"4px 8px", borderRadius:5 }}>{p}</code>
          ))}
        </div>
      </div>
    </div>
  );
}
