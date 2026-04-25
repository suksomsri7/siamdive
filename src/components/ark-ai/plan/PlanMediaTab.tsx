"use client";

import { useState, useRef } from "react";

type MediaItem = {
  id: string; url: string; thumbUrl: string | null; type: string;
  uploadedBy: string; caption: string | null; createdAt: string;
};

type Props = {
  planId: string;
  deviceId: string;
  lang: string;
  media: MediaItem[];
  canEdit: boolean;
  onRefresh: () => void;
};

export default function PlanMediaTab({ planId, deviceId, lang, media, canEdit, onRefresh }: Props) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number; percent: number } | null>(null);
  const [viewer, setViewer] = useState<MediaItem | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const isTh = lang === "th";

  const uploadFile = (form: FormData): Promise<string | null> => {
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/plans/upload");
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setProgress((prev) => prev ? { ...prev, percent: Math.round((e.loaded / e.total) * 100) } : null);
        }
      };
      xhr.onload = () => {
        if (xhr.status === 200) {
          try { resolve(JSON.parse(xhr.responseText).url); } catch { resolve(null); }
        } else { resolve(null); }
      };
      xhr.onerror = () => resolve(null);
      xhr.send(form);
    });
  };

  const handleUpload = async (files: FileList) => {
    setUploading(true);
    const fileArray = Array.from(files);
    try {
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        setProgress({ current: i + 1, total: fileArray.length, percent: 0 });

        const form = new FormData();
        form.append("file", file);
        form.append("deviceId", deviceId);

        const url = await uploadFile(form);
        if (!url) continue;

        const isVideo = file.type.startsWith("video/");
        await fetch(`/api/plans/${planId}/media`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deviceId, url, type: isVideo ? "VIDEO" : "PHOTO" }),
        });
      }
      onRefresh();
    } catch {} finally {
      setUploading(false);
      setProgress(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDelete = async (mediaId: string) => {
    try {
      await fetch(`/api/plans/${planId}/media?deviceId=${encodeURIComponent(deviceId)}&mediaId=${encodeURIComponent(mediaId)}`, {
        method: "DELETE",
      });
      if (viewer?.id === mediaId) setViewer(null);
      onRefresh();
    } catch {}
  };

  return (
    <div>
      {/* Upload button */}
      {canEdit && (
        <div style={{ marginBottom: 16 }}>
          {uploading && progress ? (
            <div style={{
              width: "100%", borderRadius: 10,
              border: "1px solid rgba(59,130,246,0.2)", background: "rgba(59,130,246,0.05)",
              padding: "10px 14px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#60a5fa" }}>
                  {isTh ? "กำลังอัพโหลด" : "Uploading"} {progress.total > 1 ? `${progress.current}/${progress.total}` : ""}
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#60a5fa" }}>{progress.percent}%</span>
              </div>
              <div style={{ width: "100%", height: 6, background: "#1a1a2e", borderRadius: 3, overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 3,
                  background: "linear-gradient(90deg, #1e40af, #3b82f6)",
                  width: `${progress.percent}%`,
                  transition: "width 0.15s ease",
                }} />
              </div>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              style={{
                width: "100%", padding: "14px 0", borderRadius: 10,
                border: "1px dashed rgba(59,130,246,0.3)", background: "rgba(59,130,246,0.05)",
                color: "#60a5fa", fontSize: 13, fontWeight: 700, cursor: "pointer",
              }}
            >
              {isTh ? "📷 อัพโหลดรูป/วิดีโอ" : "📷 Upload Photo/Video"}
            </button>
          )}
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/*"
        multiple
        style={{ display: "none" }}
        onChange={(e) => e.target.files?.length && handleUpload(e.target.files)}
      />

      {/* Gallery grid */}
      {media.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 16px" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📷</div>
          <p style={{ fontSize: 14, color: "#555" }}>
            {isTh ? "ยังไม่มีรูปในแพลน" : "No photos yet"}
          </p>
          <p style={{ fontSize: 12, color: "#333", marginTop: 4 }}>
            {isTh ? "อัพโหลดรูปและวิดีโอแชร์กับเพื่อนร่วมทริป" : "Upload photos and videos to share with your trip crew"}
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 3 }}>
          {media.map((m) => (
            <div
              key={m.id}
              onClick={() => setViewer(m)}
              style={{ position: "relative", aspectRatio: "1", cursor: "pointer", overflow: "hidden", borderRadius: 4, background: "#1a1a1a" }}
            >
              {m.type === "VIDEO" ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {m.thumbUrl ? <img src={m.thumbUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#111" }}>
                      <span style={{ fontSize: 24 }}>🎬</span>
                    </div>
                  )}
                  <div style={{ position: "absolute", bottom: 4, right: 4, background: "rgba(0,0,0,0.7)", borderRadius: 4, padding: "1px 5px", fontSize: 9, color: "#fff" }}>▶</div>
                </>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.thumbUrl || m.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Viewer modal */}
      {viewer && (
        <>
          <div onClick={() => setViewer(null)} style={{ position: "fixed", inset: 0, zIndex: 1500, background: "rgba(0,0,0,0.95)", display: "flex", flexDirection: "column" }}>
            {/* Close */}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", flexShrink: 0 }}>
              <button onClick={() => setViewer(null)} style={{ background: "none", border: "none", color: "#888", fontSize: 16, cursor: "pointer", padding: 4 }}>✕</button>
              {canEdit && (
                <button onClick={(e) => { e.stopPropagation(); handleDelete(viewer.id); }}
                  style={{ background: "none", border: "none", color: "#ef4444", fontSize: 12, cursor: "pointer", padding: 4 }}>
                  {isTh ? "ลบ" : "Delete"}
                </button>
              )}
            </div>

            {/* Content */}
            <div onClick={(e) => e.stopPropagation()} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
              {viewer.type === "VIDEO" ? (
                <video src={viewer.url} controls autoPlay style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 8 }} />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={viewer.url} alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: 8 }} />
              )}
            </div>

            {/* Info */}
            <div style={{ padding: "12px 16px", paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))", flexShrink: 0 }}>
              <p style={{ fontSize: 11, color: "#555" }}>
                {viewer.uploadedBy} · {new Date(viewer.createdAt).toLocaleDateString()}
              </p>
              {viewer.caption && <p style={{ fontSize: 13, color: "#e5e5e5", marginTop: 4 }}>{viewer.caption}</p>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
