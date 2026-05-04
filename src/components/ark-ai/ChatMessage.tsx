"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import ChatTripCard from "./ChatTripCard";
import ChatBlogCard from "./ChatBlogCard";
import ComparisonTable from "./ComparisonTable";
import BookingButtons from "./BookingButtons";
import PackageTable from "./PackageTable";
import TripSchedulePicker from "./TripSchedulePicker";

type Props = {
  role: "user" | "assistant";
  content: string;
  msgIndex: number;
  isStreaming?: boolean;
  onFeedback?: (msgIndex: number, positive: boolean) => void;
  feedbackGiven?: boolean;
  lang?: string;
  onAskClick?: (value: string) => void;
  onScheduleAdded?: (info: { boatTitle: string; scheduleDate: string; area: string; type: string }) => void;
};

type SelectedTrip = {
  boatId: string;
  title: string;
  slug: string;
  type: string;
  area: string;
  cover: string | null;
};

type AskOption = { label: string; value: string };
type ParsedPart =
  | { type: "text"; content: string }
  | { type: "trip"; data: Record<string, unknown> }
  | { type: "blog"; data: Record<string, unknown> }
  | { type: "compare"; data: { boats: Record<string, unknown>[] } }
  | { type: "booking"; data: { boatTitle: string; boatId?: string; schedule?: string | null; price?: number | null } }
  | { type: "packages"; data: { boatTitle: string; scheduleDate?: string; packages: { title: string; excerpt: string; recommended?: boolean; isFull?: boolean }[] } }
  | { type: "ask"; data: { prompt?: string; options: AskOption[] } };

function extractBalancedJson(text: string, start: number): string | null {
  if (text[start] !== "{") return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (escape) { escape = false; continue; }
    if (ch === "\\") { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{") depth++;
    else if (ch === "}") { depth--; if (depth === 0) return text.slice(start, i + 1); }
  }
  return null;
}

function parseStructured(text: string): ParsedPart[] {
  const parts: ParsedPart[] = [];
  const tagRegex = /\$\$(TRIP|BLOG|COMPARE|BOOKING|PACKAGES|ASK)\{/g;
  let lastIndex = 0;
  let match;

  while ((match = tagRegex.exec(text)) !== null) {
    const jsonStart = match.index + 2 + match[1].length;
    const jsonStr = extractBalancedJson(text, jsonStart);
    if (!jsonStr) continue;
    const endIndex = jsonStart + jsonStr.length;
    if (text.slice(endIndex, endIndex + 2) !== "$$") continue;

    if (match.index > lastIndex) {
      parts.push({ type: "text", content: text.slice(lastIndex, match.index) });
    }
    try {
      const data = JSON.parse(jsonStr);
      const kind = match[1].toLowerCase() as "trip" | "blog" | "compare" | "booking" | "packages" | "ask";
      parts.push({ type: kind, data });
    } catch {
      parts.push({ type: "text", content: text.slice(match.index, endIndex + 2) });
    }
    lastIndex = endIndex + 2;
    tagRegex.lastIndex = lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({ type: "text", content: text.slice(lastIndex) });
  }

  return parts;
}

function cleanText(text: string): string {
  return text
    .replace(/```[\w]*\n?/g, "")
    .replace(/\[ดูรายละเอียด.*?\]\(.*?\)/g, "")
    .replace(/\[(?:ดู|อ่าน|View|Read|See|More|Details|Link).*?\]\(.*?\)/gi, "")
    .replace(/https?:\/\/(?:www\.)?siamdive\.com\S*/gi, "")
    .replace(/\n{3,}/g, "\n\n");
}

function renderMarkdown(rawText: string) {
  const text = cleanText(rawText);
  const lines = text.split("\n");

  while (lines.length && lines[0].trim() === "") lines.shift();
  while (lines.length && lines[lines.length - 1].trim() === "") lines.pop();

  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    let html = line.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    html = html.replace(/\*(.*?)\*/g, '<i>$1</i>');
    html = html.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

    if (line.startsWith("### ")) {
      elements.push(<h4 key={i} style={{ fontSize: 15, fontWeight: 700, color: "#f5f5f5", margin: "6px 0 2px" }} dangerouslySetInnerHTML={{ __html: html.slice(4) }} />);
      i++; continue;
    }
    if (line.startsWith("## ")) {
      elements.push(<h3 key={i} style={{ fontSize: 16, fontWeight: 700, color: "#f5f5f5", margin: "6px 0 2px" }} dangerouslySetInnerHTML={{ __html: html.slice(3) }} />);
      i++; continue;
    }
    if (line.startsWith("- ") || line.startsWith("* ")) {
      elements.push(<div key={i} style={{ display: "flex", gap: 6, marginLeft: 4, fontSize: 14, lineHeight: 1.6, color: "#ccc" }}><span style={{ color: "#555", flexShrink: 0 }}>•</span><span dangerouslySetInnerHTML={{ __html: html.slice(2) }} /></div>);
      i++; continue;
    }

    const numMatch = line.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      const num = numMatch[1];
      let itemHtml = numMatch[2].replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\*(.*?)\*/g, '<i>$1</i>').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
      elements.push(<div key={i} style={{ display: "flex", gap: 6, marginLeft: 4, fontSize: 14, lineHeight: 1.6, color: "#ccc" }}><span style={{ color: "#60a5fa", fontWeight: 700, flexShrink: 0, minWidth: 16 }}>{num}.</span><span dangerouslySetInnerHTML={{ __html: itemHtml }} /></div>);
      i++; continue;
    }

    if (line.trim() === "") {
      if (i > 0 && lines[i - 1]?.trim() === "") { i++; continue; }
      elements.push(<div key={i} style={{ height: 4 }} />);
      i++; continue;
    }

    elements.push(<p key={i} style={{ fontSize: 14, lineHeight: 1.6, color: "#ccc", margin: "1px 0" }} dangerouslySetInnerHTML={{ __html: html }} />);
    i++;
  }

  return elements;
}

export default function ChatMessage({ role, content, msgIndex, isStreaming, onFeedback, feedbackGiven, onAskClick, onScheduleAdded }: Props) {
  const isUser = role === "user";
  const lang = (useParams().lang as string) || "en";
  const [selectedTrip, setSelectedTrip] = useState<SelectedTrip | null>(null);

  if (isUser) {
    return (
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "4px 0" }}>
        <div style={{
          maxWidth: "85%", padding: "10px 14px", borderRadius: "16px 16px 4px 16px",
          background: "#1e40af", color: "#fff", fontSize: 14, lineHeight: 1.5,
        }}>
          {content}
        </div>
      </div>
    );
  }

  const parts = parseStructured(content);

  const allTrips = parts.filter((p): p is ParsedPart & { type: "trip" } => p.type === "trip").map(p => p.data);
  const rendered: React.ReactNode[] = [];
  let tripRowPlaced = false;

  const firstTripIdx = parts.findIndex(p => p.type === "trip");
  let lastTripIdx = -1;
  for (let k = parts.length - 1; k >= 0; k--) { if (parts[k].type === "trip") { lastTripIdx = k; break; } }

  const afterTripTexts: string[] = [];

  const handleSelectTrip = (trip: SelectedTrip) => {
    setSelectedTrip(prev => prev?.boatId === trip.boatId ? null : trip);
  };

  parts.forEach((part, i) => {
    if (part.type === "trip") {
      if (!tripRowPlaced) {
        rendered.push(
          <div key="trip-row" className="ark-trip-row" style={{
            display: "flex", gap: 8, overflowX: "auto", overflowY: "visible",
            padding: "4px 0",
            scrollbarWidth: "none",
          }}>
            {allTrips.map((t, j) => (
              <ChatTripCard key={j} {...t as any} onSelectTrip={handleSelectTrip} />
            ))}
          </div>
        );
        if (selectedTrip) {
          rendered.push(
            <TripSchedulePicker
              key={`picker-${selectedTrip.boatId}`}
              {...selectedTrip}
              lang={lang}
              onClose={() => setSelectedTrip(null)}
              onAdded={(info) => {
                setTimeout(() => setSelectedTrip(null), 1200);
                if (info) onScheduleAdded?.(info);
              }}
            />
          );
        }
        tripRowPlaced = true;
      }
      return;
    }

    if (part.type === "text" && firstTripIdx >= 0 && i > firstTripIdx && i < lastTripIdx) {
      return;
    }

    if (part.type === "text" && firstTripIdx >= 0 && i > lastTripIdx) {
      afterTripTexts.push(part.content);
      return;
    }

    switch (part.type) {
      case "blog":
        rendered.push(<ChatBlogCard key={i} {...part.data as any} />);
        break;
      case "compare":
        rendered.push(<ComparisonTable key={i} boats={(part.data as any).boats || []} />);
        break;
      case "booking":
        rendered.push(<BookingButtons key={i} {...part.data as any} />);
        break;
      case "packages":
        rendered.push(<PackageTable key={i} {...part.data as any} />);
        break;
      case "ask": {
        const askData = part.data as { prompt?: string; options: AskOption[] };
        const opts = Array.isArray(askData.options) ? askData.options : [];
        if (!opts.length) break;
        rendered.push(
          <div key={`ask-${i}`} style={{ marginTop: 8, marginBottom: 4 }}>
            {askData.prompt && (
              <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 6 }}>{askData.prompt}</div>
            )}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {opts.map((o, j) => (
                <button
                  key={j}
                  type="button"
                  onClick={() => onAskClick?.(o.value || o.label)}
                  disabled={!onAskClick || isStreaming}
                  style={{
                    padding: "7px 14px",
                    borderRadius: 999,
                    border: "1px solid #1e40af",
                    background: "rgba(30,64,175,0.18)",
                    color: "#93c5fd",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: onAskClick && !isStreaming ? "pointer" : "default",
                    whiteSpace: "nowrap",
                    transition: "background 0.15s",
                  }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>,
        );
        break;
      }
      default:
        rendered.push(<div key={i}>{renderMarkdown(part.content)}</div>);
    }
  });

  if (afterTripTexts.length > 0) {
    const merged = afterTripTexts.join("\n").replace(/^\n+/, "");
    if (merged.trim()) {
      rendered.push(<div key="after-trips">{renderMarkdown(merged)}</div>);
    }
  }

  return (
    <div style={{ padding: "4px 0" }}>
      <div style={{ maxWidth: "92%" }}>
        {rendered}
        {isStreaming && (
          <span style={{ display: "inline-block", width: 6, height: 14, background: "#60a5fa", borderRadius: 1, animation: "blink 1s infinite", verticalAlign: "middle", marginLeft: 2 }} />
        )}
      </div>
      {!isStreaming && content && onFeedback && (
        <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
          <button
            onClick={() => onFeedback(msgIndex, true)}
            disabled={feedbackGiven !== undefined}
            title="Good response"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 28, height: 28, borderRadius: 6,
              background: feedbackGiven === true ? "rgba(255,255,255,0.12)" : "transparent",
              border: `1px solid ${feedbackGiven === true ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.12)"}`,
              cursor: feedbackGiven !== undefined ? "default" : "pointer",
              opacity: feedbackGiven === false ? 0.25 : 1,
              transition: "all 0.15s",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={feedbackGiven === true ? "#fff" : "rgba(255,255,255,0.45)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 10v12"/><path d="M15 5.88L14 10h5.83a2 2 0 011.92 2.56l-2.33 8A2 2 0 0117.5 22H4a2 2 0 01-2-2v-8a2 2 0 012-2h2.76a2 2 0 001.79-1.11L12 2a3.13 3.13 0 013 3.88z"/>
            </svg>
          </button>
          <button
            onClick={() => onFeedback(msgIndex, false)}
            disabled={feedbackGiven !== undefined}
            title="Bad response"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 28, height: 28, borderRadius: 6,
              background: feedbackGiven === false ? "rgba(255,255,255,0.12)" : "transparent",
              border: `1px solid ${feedbackGiven === false ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.12)"}`,
              cursor: feedbackGiven !== undefined ? "default" : "pointer",
              opacity: feedbackGiven === true ? 0.25 : 1,
              transition: "all 0.15s",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={feedbackGiven === false ? "#fff" : "rgba(255,255,255,0.45)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 14V2"/><path d="M9 18.12L10 14H4.17a2 2 0 01-1.92-2.56l2.33-8A2 2 0 016.5 2H20a2 2 0 012 2v8a2 2 0 01-2 2h-2.76a2 2 0 00-1.79 1.11L12 22a3.13 3.13 0 01-3-3.88z"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
