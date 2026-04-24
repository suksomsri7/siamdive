"use client";

import { readRecentBoats } from "@/lib/recentlyViewed";
import { getPlan } from "@/lib/plan-store";
import { monthName, seasonInfo } from "@/lib/dive-season";

function buildChips(lang: string, pathname: string): { label: string; query: string }[] {
  const recentCount = readRecentBoats().length;
  const plan = getPlan();
  const mn = monthName(lang);
  const s = seasonInfo();
  const isTh = lang === "th";

  const chips: { label: string; query: string }[] = [];

  const onTrip = /\/trips\//.test(pathname);
  const onBlog = /\/blogs\//.test(pathname);

  if (onTrip) {
    chips.push(
      isTh ? { label: "รายละเอียดทริปนี้", query: "ช่วยอธิบายรายละเอียดทริปนี้ให้หน่อย ดำกี่ไดฟ์ ไปไหนบ้าง" }
           : { label: "Trip details", query: "Tell me more about this trip — how many dives, what sites?" },
      isTh ? { label: "เทียบกับเรืออื่น", query: "มีเรือลำอื่นที่ไปพื้นที่เดียวกันไหม ช่วยเปรียบเทียบให้หน่อย" }
           : { label: "Compare boats", query: "Are there other boats going to the same area? Compare them." },
      isTh ? { label: "เช็ควันว่าง", query: "ทริปนี้มีวันไหนว่างบ้าง" }
           : { label: "Available dates", query: "When is this trip available?" },
    );
  } else if (onBlog) {
    chips.push(
      isTh ? { label: "หาทริปที่เกี่ยวข้อง", query: "จากบทความนี้ มีทริปไหนที่เกี่ยวข้องบ้าง" }
           : { label: "Related trips", query: "Based on this article, what trips are related?" },
      isTh ? { label: "วางแผนทริปตามบทความ", query: "อยากวางแผนทริปตามสถานที่ในบทความนี้" }
           : { label: "Plan from article", query: "I want to plan a trip based on the locations in this article." },
    );
  }

  if (plan.trips.length > 0 && !onTrip) {
    const firstTrip = plan.trips[0];
    chips.push(
      isTh ? { label: `ทริป${firstTrip.area ? "ใน " + firstTrip.area : ""}อื่นๆ`, query: `แนะนำทริปอื่นๆ ${firstTrip.area ? "ในพื้นที่ " + firstTrip.area : "ที่คล้ายกับ " + firstTrip.title}` }
           : { label: `More in ${firstTrip.area || "this area"}`, query: `Suggest more trips ${firstTrip.area ? "in " + firstTrip.area : "similar to " + firstTrip.title}` },
    );
  }

  if (recentCount >= 2 && !onTrip) {
    chips.push(
      isTh ? { label: "เปรียบเทียบทริปที่ดูมา", query: "ช่วยเปรียบเทียบทริปที่ผมเพิ่งดูมาให้หน่อย" }
           : { label: "Compare trips I viewed", query: "Compare the trips I've been browsing." },
    );
  }

  if (s.whaleShark && chips.length < 4) {
    chips.push(
      isTh ? { label: "ดูฉลามวาฬ" , query: `ตอนนี้เดือน${mn} เป็นช่วงฉลามวาฬไหม ไปดูที่ไหนดี` }
           : { label: "Whale sharks", query: `It's ${mn} — is this whale shark season? Where can I see them?` },
    );
  }

  if (s.coast === "andaman" && chips.length < 5) {
    chips.push(
      isTh ? { label: `Liveaboard เดือน${mn}`, query: `มี Liveaboard ออกเดือน${mn}ไหม แนะนำให้หน่อย` }
           : { label: `Liveaboard in ${mn}`, query: `Any liveaboard trips departing in ${mn}?` },
    );
  } else if (s.coast === "gulf" && chips.length < 5) {
    chips.push(
      isTh ? { label: "ดำน้ำเกาะเต่า", query: "อยากไปดำน้ำเกาะเต่า แนะนำทริปให้หน่อย" }
           : { label: "Koh Tao diving", query: "I want to dive at Koh Tao, what do you recommend?" },
    );
  }

  if (chips.length < 5) {
    chips.push(
      isTh ? { label: `ดำน้ำเดือน${mn}`, query: `เดือน${mn}ดำน้ำที่ไหนดี สภาพอากาศเป็นยังไง` }
           : { label: `Diving in ${mn}`, query: `Where is best to dive in ${mn}? What are conditions like?` },
    );
  }

  if (recentCount === 0 && chips.length < 5) {
    chips.push(
      isTh ? { label: "มือใหม่หัดดำ", query: "ยังไม่เคยดำน้ำ อยากลองดำครั้งแรก แนะนำอะไรดี" }
           : { label: "First time diving", query: "I've never dived before, what do you recommend for beginners?" },
    );
  }

  if (chips.length < 5) {
    chips.push(
      isTh ? { label: "มีทริปอะไรบ้าง", query: "มีทริปดำน้ำอะไรให้เลือกบ้าง แนะนำให้หน่อย" }
           : { label: "Show all trips", query: "What dive trips do you have? Show me everything." },
    );
  }

  return chips.slice(0, 5);
}

export default function SuggestionChips({ lang, onSelect, pathname }: { lang: string; onSelect: (q: string) => void; pathname?: string }) {
  const chips = buildChips(lang, pathname || "/");

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "8px 0" }}>
      {chips.map(c => (
        <button key={c.label} onClick={() => onSelect(c.query)}
          style={{
            padding: "6px 12px", borderRadius: 16,
            background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)",
            color: "#60a5fa", fontSize: 11, fontWeight: 600,
            cursor: "pointer", transition: "background 0.15s",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(59,130,246,0.2)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(59,130,246,0.1)")}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}
