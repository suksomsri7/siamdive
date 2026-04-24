"use client";

import ChatTripCard from "./ChatTripCard";
import ChatBlogCard from "./ChatBlogCard";
import ComparisonTable from "./ComparisonTable";
import ItineraryCard, { type ItineraryData } from "./ItineraryCard";
import BookingButtons from "./BookingButtons";

type Props = {
  role: "user" | "assistant";
  content: string;
  msgIndex: number;
  isStreaming?: boolean;
  onFeedback?: (msgIndex: number, positive: boolean) => void;
  feedbackGiven?: boolean;
  onItinerarySave?: (data: ItineraryData) => void;
  lang?: string;
};

type ParsedPart =
  | { type: "text"; content: string }
  | { type: "trip"; data: Record<string, unknown> }
  | { type: "blog"; data: Record<string, unknown> }
  | { type: "compare"; data: { boats: Record<string, unknown>[] } }
  | { type: "itinerary"; data: ItineraryData }
  | { type: "booking"; data: { boatTitle: string; boatId?: string; schedule?: string | null; price?: number | null } };

function parseStructured(text: string): ParsedPart[] {
  const parts: ParsedPart[] = [];
  const regex = /\$\$(TRIP|BLOG|COMPARE|ITINERARY|BOOKING)(\{[\s\S]*?\})\$\$/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", content: text.slice(lastIndex, match.index) });
    }
    try {
      const data = JSON.parse(match[2]);
      const kind = match[1].toLowerCase() as "trip" | "blog" | "compare" | "itinerary" | "booking";
      parts.push({ type: kind, data });
    } catch {
      parts.push({ type: "text", content: match[0] });
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: "text", content: text.slice(lastIndex) });
  }

  return parts;
}

function renderMarkdown(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    let html = line.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    html = html.replace(/\*(.*?)\*/g, '<i>$1</i>');

    if (line.startsWith("### ")) {
      return <h4 key={i} style={{ fontSize: 13, fontWeight: 700, color: "#f5f5f5", margin: "8px 0 4px" }} dangerouslySetInnerHTML={{ __html: html.slice(4) }} />;
    }
    if (line.startsWith("## ")) {
      return <h3 key={i} style={{ fontSize: 14, fontWeight: 700, color: "#f5f5f5", margin: "10px 0 4px" }} dangerouslySetInnerHTML={{ __html: html.slice(3) }} />;
    }
    if (line.startsWith("- ") || line.startsWith("* ")) {
      return <li key={i} style={{ marginLeft: 16, fontSize: 12, lineHeight: 1.6, color: "#ccc" }} dangerouslySetInnerHTML={{ __html: html.slice(2) }} />;
    }
    if (line.match(/^\d+\. /)) {
      return <li key={i} style={{ marginLeft: 16, fontSize: 12, lineHeight: 1.6, color: "#ccc", listStyleType: "decimal" }} dangerouslySetInnerHTML={{ __html: html.replace(/^\d+\.\s*/, '') }} />;
    }
    if (line.trim() === "") return <br key={i} />;

    return <p key={i} style={{ fontSize: 12, lineHeight: 1.6, color: "#ccc", margin: "2px 0" }} dangerouslySetInnerHTML={{ __html: html }} />;
  });
}

export default function ChatMessage({ role, content, msgIndex, isStreaming, onFeedback, feedbackGiven, onItinerarySave }: Props) {
  const isUser = role === "user";

  if (isUser) {
    return (
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "4px 0" }}>
        <div style={{
          maxWidth: "85%", padding: "10px 14px", borderRadius: "16px 16px 4px 16px",
          background: "#1e40af", color: "#fff", fontSize: 13, lineHeight: 1.5,
        }}>
          {content}
        </div>
      </div>
    );
  }

  const parts = parseStructured(content);

  return (
    <div style={{ padding: "4px 0" }}>
      <div style={{ maxWidth: "92%" }}>
        {parts.map((part, i) => {
          switch (part.type) {
            case "trip":
              return <ChatTripCard key={i} {...part.data as any} />;
            case "blog":
              return <ChatBlogCard key={i} {...part.data as any} />;
            case "compare":
              return <ComparisonTable key={i} boats={(part.data as any).boats || []} />;
            case "itinerary":
              return <ItineraryCard key={i} data={part.data as ItineraryData} onSave={onItinerarySave} />;
            case "booking":
              return <BookingButtons key={i} {...part.data as any} />;
            default:
              return <div key={i}>{renderMarkdown(part.content)}</div>;
          }
        })}
        {isStreaming && (
          <span style={{ display: "inline-block", width: 6, height: 14, background: "#60a5fa", borderRadius: 1, animation: "blink 1s infinite", verticalAlign: "middle", marginLeft: 2 }} />
        )}
      </div>
      {!isStreaming && content && onFeedback && (
        <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
          <button
            onClick={() => onFeedback(msgIndex, true)}
            style={{
              background: "none", border: "none", cursor: feedbackGiven !== undefined ? "default" : "pointer",
              fontSize: 12, padding: "2px 4px",
              color: feedbackGiven === true ? "#4ade80" : feedbackGiven === false ? "#333" : "#555",
              opacity: feedbackGiven === false ? 0.4 : 1,
              transition: "color 0.15s, opacity 0.15s",
            }}
            disabled={feedbackGiven !== undefined}
            title="Good response"
          >
            {"👍"}
          </button>
          <button
            onClick={() => onFeedback(msgIndex, false)}
            style={{
              background: "none", border: "none", cursor: feedbackGiven !== undefined ? "default" : "pointer",
              fontSize: 12, padding: "2px 4px",
              color: feedbackGiven === false ? "#ef4444" : feedbackGiven === true ? "#333" : "#555",
              opacity: feedbackGiven === true ? 0.4 : 1,
              transition: "color 0.15s, opacity 0.15s",
            }}
            disabled={feedbackGiven !== undefined}
            title="Bad response"
          >
            {"👎"}
          </button>
        </div>
      )}
    </div>
  );
}
