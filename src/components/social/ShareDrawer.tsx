"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import ShareImageEditor from "./ShareImageEditor";

type Account = {
  id: string;
  pageName: string;
  language: string;
  avatarUrl: string;
};

type Tone = "invite" | "story" | "question";
const TONE_LABEL: Record<Tone, string> = {
  invite: "ชวนเที่ยว",
  story: "เล่าเรื่อง",
  question: "คำถาม",
};

type ScheduleMode = "queue" | "datetime" | "now";

export default function ShareDrawer({
  blogId,
  language,
  defaultImage,
  blogTitle,
  blogExcerpt,
  blogSlug,
  onClose,
}: {
  blogId: string;
  language: string;
  defaultImage?: string;
  blogTitle: string;
  blogExcerpt: string;
  blogSlug: string;
  onClose: () => void;
}) {
  const shareUrl = `https://siamdive.com/${language}/blogs/${blogSlug}`;

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountId, setAccountId] = useState<string>("");
  const [caption, setCaption] = useState<string>(() =>
    buildCaption(blogExcerpt, "", shareUrl)
  );
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagDraft, setHashtagDraft] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string>(defaultImage || "");
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>("queue");
  const [scheduledAt, setScheduledAt] = useState<string>(() => {
    const d = new Date();
    d.setHours(d.getHours() + 1, 0, 0, 0);
    // datetime-local needs YYYY-MM-DDTHH:MM
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });
  const [aiCaptionLoading, setAiCaptionLoading] = useState<Tone | "">("");
  const [aiHashtagsLoading, setAiHashtagsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  // Pull paragraph 2 from content and rebuild caption (once on mount).
  useEffect(() => {
    fetch(`/api/blogs/${blogId}`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d?.translations) return;
        const tr = d.translations.find((t: { lang: string }) => t.lang === language) || d.translations[0];
        const p2 = extractParagraph(tr?.content || "", 2);
        setCaption(buildCaption(tr?.excerpt || blogExcerpt, p2, shareUrl));
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blogId, language]);

  // Load accounts on mount + auto-pick by language
  useEffect(() => {
    let cancel = false;
    (async () => {
      const res = await fetch("/api/social/accounts", { credentials: "include" });
      if (!res.ok) {
        if (!cancel) setToast({ type: "err", msg: "โหลด Buffer accounts ไม่สำเร็จ" });
        return;
      }
      const data = await res.json() as { accounts: Account[] };
      if (cancel) return;
      setAccounts(data.accounts);
      const match = data.accounts.find(a => a.language === language) || data.accounts[0];
      if (match) setAccountId(match.id);
    })();
    return () => { cancel = true; };
  }, [language]);

  // Lock body scroll while drawer open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Auto-clear toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const fullText = useMemo(() => {
    const tags = hashtags.filter(t => t && t.startsWith("#")).join(" ");
    return tags ? `${caption.trim()}\n\n${tags}` : caption.trim();
  }, [caption, hashtags]);

  const captionLen = fullText.length;

  const addHashtag = (raw: string) => {
    const cleaned = raw.trim().replace(/\s+/g, "");
    if (!cleaned) return;
    const tag = cleaned.startsWith("#") ? cleaned : `#${cleaned}`;
    if (hashtags.includes(tag)) return;
    setHashtags([...hashtags, tag]);
  };

  async function aiCaption(tone: Tone) {
    setAiCaptionLoading(tone);
    try {
      const res = await fetch("/api/social/ai/caption", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blogId, language, tone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI failed");
      setCaption(data.caption);
    } catch (err) {
      setToast({ type: "err", msg: err instanceof Error ? err.message : "AI failed" });
    } finally {
      setAiCaptionLoading("");
    }
  }

  async function aiHashtags() {
    setAiHashtagsLoading(true);
    try {
      const res = await fetch("/api/social/ai/hashtags", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blogId, language, count: 10 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI failed");
      setHashtags(data.hashtags as string[]);
    } catch (err) {
      setToast({ type: "err", msg: err instanceof Error ? err.message : "AI failed" });
    } finally {
      setAiHashtagsLoading(false);
    }
  }

  async function submit() {
    if (!caption.trim()) { setToast({ type: "err", msg: "ใส่ caption ก่อน" }); return; }
    if (!accountId) { setToast({ type: "err", msg: "เลือก FB Page ก่อน" }); return; }
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        blogId,
        accountId,
        caption,
        hashtags,
        imageUrl: imageUrl || undefined,
        language,
      };
      if (scheduleMode === "now") body.postNow = true;
      else if (scheduleMode === "datetime") body.scheduledAt = new Date(scheduledAt).toISOString();
      // queue: omit scheduledAt → Buffer auto-slots
      const res = await fetch("/api/social/share", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "share failed");
      setToast({ type: "ok", msg: scheduleMode === "now" ? "โพสแล้ว ✅" : "เข้าคิว Buffer แล้ว ✅" });
      setTimeout(() => onClose(), 1200);
    } catch (err) {
      setToast({ type: "err", msg: err instanceof Error ? err.message : "ผิดพลาด" });
    } finally {
      setSubmitting(false);
    }
  }

  const selectedAccount = accounts.find(a => a.id === accountId);
  const noAccounts = accounts.length === 0;

  return createPortal(
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000 }} />
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0,
        width: "min(100%, 480px)",
        background: "#0f0f0f", color: "#e5e5e5",
        zIndex: 1001, overflowY: "auto",
        borderLeft: "1px solid #222",
        display: "flex", flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{ padding: "16px 18px", borderBottom: "1px solid #222", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "#0f0f0f", zIndex: 2 }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, margin: 0 }}>📤 แชร์ลง Facebook</h2>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#888", fontSize: 22, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>

        {/* Body */}
        <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 18 }}>
          {noAccounts && (
            <div style={{ background: "#1a1a1a", border: "1px solid #f59e0b", borderRadius: 8, padding: 14, fontSize: 12 }}>
              <p style={{ margin: 0, color: "#f59e0b", fontWeight: 700 }}>ยังไม่ได้เชื่อม Buffer</p>
              <p style={{ margin: "6px 0 10px", color: "#aaa", lineHeight: 1.5 }}>คลิกเชื่อม Buffer account ครั้งแรกเพื่อเริ่มโพส</p>
              <a href="/api/social/buffer/oauth/start" style={{ display: "inline-block", background: "#1877f2", color: "#fff", padding: "8px 14px", borderRadius: 6, fontWeight: 700, textDecoration: "none", fontSize: 12 }}>
                🔗 เชื่อม Buffer
              </a>
            </div>
          )}

          {/* Live FB card preview */}
          <FbCardPreview
            imageUrl={imageUrl}
            url={`siamdive.com/${language}/blogs/${blogSlug}`}
            title={blogTitle}
            description={blogExcerpt}
            caption={fullText}
            pageName={selectedAccount?.pageName || "SiamDive"}
            avatarUrl={selectedAccount?.avatarUrl || ""}
          />

          {/* Page selector */}
          {accounts.length > 0 && (
            <Section label="โพสไปที่">
              <select
                value={accountId}
                onChange={e => setAccountId(e.target.value)}
                style={inputStyle}
              >
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.pageName} ({a.language.toUpperCase()})
                  </option>
                ))}
              </select>
            </Section>
          )}

          {/* Caption */}
          <Section
            label="Caption"
            right={
              <div style={{ display: "flex", gap: 4 }}>
                {(["invite", "story", "question"] as Tone[]).map(t => (
                  <button
                    key={t}
                    onClick={() => aiCaption(t)}
                    disabled={aiCaptionLoading !== ""}
                    style={miniBtn(aiCaptionLoading === t)}
                  >
                    {aiCaptionLoading === t ? "..." : `✨ ${TONE_LABEL[t]}`}
                  </button>
                ))}
              </div>
            }
          >
            <textarea
              value={caption}
              onChange={e => setCaption(e.target.value)}
              rows={5}
              style={{ ...inputStyle, resize: "vertical", fontFamily: "var(--font-prompt), sans-serif" }}
              placeholder="เขียน caption หรือกดปุ่ม ✨ ให้ AI ช่วยร่าง"
            />
            <div style={{ fontSize: 10, color: captionLen > 280 ? "#f59e0b" : "#666", textAlign: "right", marginTop: 4 }}>
              {captionLen} chars {captionLen > 280 ? "(ยาวเกิน FB feed preview)" : ""}
            </div>
          </Section>

          {/* Hashtags */}
          <Section
            label="Hashtags"
            right={
              <button onClick={aiHashtags} disabled={aiHashtagsLoading} style={miniBtn(aiHashtagsLoading)}>
                {aiHashtagsLoading ? "..." : "✨ แนะนำ 10 tags"}
              </button>
            }
          >
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8, minHeight: 22 }}>
              {hashtags.map((tag, i) => (
                <span key={i} style={{ background: "#1f2937", color: "#93c5fd", padding: "3px 9px", borderRadius: 4, fontSize: 11, display: "inline-flex", alignItems: "center", gap: 5 }}>
                  {tag}
                  <button
                    onClick={() => setHashtags(hashtags.filter((_, j) => j !== i))}
                    style={{ background: "transparent", border: "none", color: "#6b7280", cursor: "pointer", padding: 0, fontSize: 13, lineHeight: 1 }}
                  >×</button>
                </span>
              ))}
            </div>
            <input
              type="text"
              value={hashtagDraft}
              onChange={e => setHashtagDraft(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addHashtag(hashtagDraft);
                  setHashtagDraft("");
                }
              }}
              onBlur={() => { if (hashtagDraft) { addHashtag(hashtagDraft); setHashtagDraft(""); } }}
              placeholder="พิมพ์ tag กด Enter เพื่อเพิ่ม"
              style={inputStyle}
            />
          </Section>

          {/* Image */}
          <Section
            label="รูปภาพ"
            right={
              <button onClick={() => setEditorOpen(true)} style={miniBtn(false)}>
                ✏️ Edit / Resize
              </button>
            }
          >
            {imageUrl ? (
              <div style={{ position: "relative", borderRadius: 8, overflow: "hidden", border: "1px solid #222" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="" style={{ width: "100%", display: "block" }} />
              </div>
            ) : (
              <div style={{ padding: 24, background: "#1a1a1a", borderRadius: 8, textAlign: "center", color: "#666", fontSize: 12 }}>
                ไม่มีรูป
              </div>
            )}
          </Section>

          {/* Schedule */}
          <Section label="เวลาโพส">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Radio checked={scheduleMode === "queue"} onChange={() => setScheduleMode("queue")} label="คิวถัดไป (Buffer auto-schedule)" />
              <Radio checked={scheduleMode === "datetime"} onChange={() => setScheduleMode("datetime")} label="เลือกเวลาเอง" />
              {scheduleMode === "datetime" && (
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={e => setScheduledAt(e.target.value)}
                  style={{ ...inputStyle, marginLeft: 24, marginTop: -2 }}
                />
              )}
              <Radio checked={scheduleMode === "now"} onChange={() => setScheduleMode("now")} label="โพสเลย" />
            </div>
          </Section>

          {/* Submit */}
          <button
            onClick={submit}
            disabled={submitting || noAccounts || !caption.trim()}
            style={{
              background: submitting || noAccounts ? "#1f2937" : "#1877f2",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "13px 18px",
              fontSize: 14,
              fontWeight: 800,
              cursor: submitting || noAccounts ? "not-allowed" : "pointer",
              marginTop: 4,
            }}
          >
            {submitting ? "กำลังส่ง..." : scheduleMode === "now" ? "📤 โพสเดี๋ยวนี้" : "✓ ส่งเข้า Buffer"}
          </button>

          <div style={{ fontSize: 11, color: "#555", textAlign: "center", marginTop: -8 }}>
            หลังโพสจะดู queue ได้ที่{" "}
            <a href="/backoffice/social/queue" style={{ color: "#3b82f6" }}>backoffice → social</a>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 1002,
          background: toast.type === "ok" ? "#10b981" : "#dc2626",
          color: "#fff", padding: "12px 18px", borderRadius: 8,
          fontSize: 13, fontWeight: 700,
          boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
        }}>
          {toast.msg}
        </div>
      )}

      {/* Photo editor */}
      {editorOpen && (
        <ShareImageEditor
          initialImageUrl={imageUrl || defaultImage || ""}
          blogId={blogId}
          blogTitle={blogTitle}
          blogExcerpt={blogExcerpt}
          onSave={(newUrl) => { setImageUrl(newUrl); setEditorOpen(false); }}
          onClose={() => setEditorOpen(false)}
        />
      )}
    </>,
    document.body
  );
}

function Section({ label, right, children }: { label: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: "#888", letterSpacing: "0.05em", textTransform: "uppercase" }}>{label}</label>
        {right}
      </div>
      {children}
    </div>
  );
}

function Radio({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
      <input type="radio" checked={checked} onChange={onChange} />
      <span>{label}</span>
    </label>
  );
}

function FbCardPreview({ imageUrl, url, title, description, caption, pageName, avatarUrl }: {
  imageUrl: string; url: string; title: string; description: string; caption: string; pageName: string; avatarUrl: string;
}) {
  return (
    <div style={{ background: "#1c1e21", borderRadius: 8, overflow: "hidden", border: "1px solid #222", fontSize: 13 }}>
      <div style={{ padding: "12px 14px 0", display: "flex", alignItems: "center", gap: 8 }}>
        {avatarUrl
          ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={avatarUrl} alt="" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }} />
          : <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#3b5998", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 13 }}>f</div>
        }
        <div>
          <div style={{ fontWeight: 700, color: "#e4e6eb" }}>{pageName}</div>
          <div style={{ fontSize: 10, color: "#888" }}>เพิ่งโพส · 🌐</div>
        </div>
      </div>
      <div style={{ padding: "10px 14px", color: "#e4e6eb", whiteSpace: "pre-wrap", lineHeight: 1.4 }}>
        {caption || "(caption preview)"}
      </div>
      {imageUrl && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={imageUrl} alt="" style={{ width: "100%", display: "block" }} />
      )}
      <div style={{ background: "#3a3b3c", padding: "10px 14px" }}>
        <div style={{ fontSize: 10, color: "#b0b3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>{url}</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#e4e6eb", margin: "2px 0" }}>{title}</div>
        {description && <div style={{ fontSize: 11, color: "#b0b3b8", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{description}</div>}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#1a1a1a",
  color: "#e5e5e5",
  border: "1px solid #333",
  borderRadius: 6,
  padding: "8px 10px",
  fontSize: 13,
  outline: "none",
};

// Strip markdown/HTML and split into paragraphs separated by blank lines.
// Returns the Nth (1-indexed) non-empty paragraph, or "" if not found.
function extractParagraph(content: string, n: number): string {
  if (!content) return "";
  // Drop fenced code blocks, then images, then links → keep link text.
  const noCode = content.replace(/```[\s\S]*?```/g, "");
  const noImg = noCode.replace(/!\[[^\]]*]\([^)]*\)/g, "");
  const noLink = noImg.replace(/\[([^\]]+)]\([^)]+\)/g, "$1");
  // Strip headings, lists, blockquote markers, bold/italic markers, HTML tags.
  const stripped = noLink
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*>\s?/gm, "")
    .replace(/[*_]{1,3}/g, "")
    .replace(/<[^>]+>/g, "");
  const paras = stripped.split(/\n\s*\n+/).map(s => s.trim()).filter(Boolean);
  return paras[n - 1] ?? "";
}

function buildCaption(excerpt: string, paragraph2: string, url: string): string {
  const parts = [excerpt.trim(), paragraph2.trim()].filter(Boolean);
  parts.push("<<< อ่านต่อ >>>");
  parts.push(url);
  return parts.join("\n\n");
}

function miniBtn(loading: boolean): React.CSSProperties {
  return {
    background: loading ? "#1f2937" : "transparent",
    color: "#93c5fd",
    border: "1px solid #1f2937",
    borderRadius: 4,
    padding: "3px 8px",
    fontSize: 10,
    fontWeight: 700,
    cursor: loading ? "wait" : "pointer",
  };
}
