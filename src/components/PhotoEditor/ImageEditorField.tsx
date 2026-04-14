"use client";

import { useState, useRef } from "react";
import PhotoEditor from "./index";
import type { EditJson } from "./PhotoEditor";

export type ImageItem = { url: string; id: string };

type Props = {
  // Single image mode (e.g. logo, OG image, banner)
  value?: string;
  onChange?: (url: string) => void;

  // Multi image mode (e.g. blog cover gallery)
  values?: string[];
  onChangeMulti?: (urls: string[]) => void;

  // Display options
  aspectRatio?: number; // 16/9 ≈ 1.78 cover (matches blog list), 1.91 = OG, 1 = square
  label?: string;
  hint?: string;
  width?: number | string;
  height?: number | string;
  multi?: boolean;
};

// ── Client-side resize before upload ─────────────────────────────────────────
// Shrinks large images to max 2400px (longest side) and compresses to JPEG 85%
// to stay under Vercel's 4.5 MB body limit and improve SEO/performance.
const MAX_DIMENSION = 2400;
const COMPRESS_QUALITY = 0.85;

function resizeImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    // Skip non-raster or already-small files
    if (!file.type.startsWith("image/") || file.size <= 2 * 1024 * 1024) {
      resolve(file);
      return;
    }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const { width, height } = img;
      // No resize needed if already within bounds
      if (width <= MAX_DIMENSION && height <= MAX_DIMENSION) {
        // Still compress if file is large (>4 MB)
        if (file.size <= 4 * 1024 * 1024) { resolve(file); return; }
      }
      const scale = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height, 1);
      const w = Math.round(width * scale);
      const h = Math.round(height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(file); return; }
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          const ext = "jpg";
          const name = file.name.replace(/\.[^.]+$/, "") + `.${ext}`;
          resolve(new File([blob], name, { type: "image/jpeg" }));
        },
        "image/jpeg",
        COMPRESS_QUALITY,
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("ไม่สามารถอ่านไฟล์ภาพได้")); };
    img.src = url;
  });
}

export default function ImageEditorField(props: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); // 0-100, only meaningful while uploading
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const [editorState, setEditorState] = useState<{
    id: string;
    url: string;
    initialEdit?: EditJson;
    replaceUrl?: string; // if re-editing existing, the url to replace
  } | null>(null);

  const aspect = props.aspectRatio ?? 16 / 9;
  const isMulti = props.multi ?? false;

  // ── Upload original → open editor ─────────────────────────────────────────
  // Uses XHR (not fetch) so we can show real upload progress and abort on timeout.
  // Browser fetch() does not support upload progress events.
  const handleFile = async (file: File) => {
    // Client-side validation: catch obvious problems before round-tripping
    if (!file.type.startsWith("image/")) {
      alert(`ไฟล์นี้ไม่ใช่รูปภาพ (type: ${file.type || "unknown"})`);
      return;
    }
    const MAX_BYTES = 40 * 1024 * 1024; // 40 MB — covers most DSLR JPEGs and iPhone HEIC
    if (file.size > MAX_BYTES) {
      alert(`ไฟล์ใหญ่เกินไป (${(file.size / 1024 / 1024).toFixed(1)} MB) — ขนาดสูงสุด 40 MB\n\nลองลดขนาดในเครื่องก่อน หรือ export เป็น JPEG quality 90`);
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    // Resize & compress before uploading (stays under Vercel 4.5 MB limit)
    let resized: File;
    try {
      resized = await resizeImage(file);
    } catch {
      resized = file; // fallback to original if resize fails
    }

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;
    const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes hard cap

    const cleanup = () => {
      setUploading(false);
      setUploadProgress(0);
      xhrRef.current = null;
    };

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        setUploadProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      const status = xhr.status;
      const raw = xhr.responseText ?? "";
      let data: any = null;
      try { data = JSON.parse(raw); } catch {}

      if (status >= 200 && status < 300 && data?.id && data?.originalUrl) {
        setEditorState({ id: data.id, url: data.originalUrl });
        cleanup();
        return;
      }

      const serverMsg = data?.error || raw.slice(0, 300) || `HTTP ${status}`;
      if (status === 0) {
        alert("เชื่อมต่อ server ไม่ได้ (network error / CORS)");
      } else if (status === 401) {
        alert("Session หมดอายุ — กรุณา login เข้า /backoffice/login ใหม่แล้วลองอีกครั้ง");
      } else if (status === 403) {
        alert("ไม่มีสิทธิ์อัปโหลด (upload.write)");
      } else if (status === 413) {
        alert(`ไฟล์ใหญ่เกินกว่า server จะรับได้ — ${serverMsg}`);
      } else {
        alert(`อัปโหลดล้มเหลว (${status}): ${serverMsg}`);
      }
      console.error("Upload failed:", status, serverMsg, data);
      cleanup();
    };

    xhr.onerror = () => {
      alert("เชื่อมต่อ server ขาด (network error)");
      console.error("Upload network error");
      cleanup();
    };

    xhr.ontimeout = () => {
      alert(`อัปโหลดเกินเวลา ${TIMEOUT_MS / 1000}s — ลองใหม่ หรือลดขนาดไฟล์`);
      cleanup();
    };

    xhr.onabort = () => {
      cleanup();
    };

    xhr.timeout = TIMEOUT_MS;
    xhr.open("POST", "/api/blog-images");
    xhr.withCredentials = true; // include session cookie

    const fd = new FormData();
    fd.append("original", resized);
    xhr.send(fd);
  };

  const cancelUpload = () => {
    if (xhrRef.current) {
      xhrRef.current.abort();
    }
  };

  // ── Re-edit existing image (lookup by coverUrl) ───────────────────────────
  const handleEdit = async (coverUrl: string) => {
    try {
      const res = await fetch(`/api/blog-images?coverUrl=${encodeURIComponent(coverUrl)}`);
      if (!res.ok) {
        // Fallback: re-upload as new image (treat existing url as if uploading new)
        alert("ไม่พบภาพต้นฉบับในระบบ — กรุณาอัปโหลดใหม่");
        return;
      }
      const data = await res.json();
      let initialEdit: EditJson | undefined;
      try {
        if (data.editJson && data.editJson !== "{}") initialEdit = JSON.parse(data.editJson);
      } catch {}
      setEditorState({
        id: data.id,
        url: data.originalUrl,
        initialEdit,
        replaceUrl: coverUrl,
      });
    } catch (e) {
      console.error(e);
      alert("ไม่สามารถเปิดภาพเพื่อแก้ไข");
    }
  };

  // ── Save from editor ──────────────────────────────────────────────────────
  const handleSave = (result: { coverUrl: string; ogUrl: string }) => {
    if (!editorState) return;
    if (isMulti && props.onChangeMulti) {
      const urls = props.values ?? [];
      if (editorState.replaceUrl) {
        // Re-edit: replace at same index
        const idx = urls.indexOf(editorState.replaceUrl);
        if (idx >= 0) {
          const newUrls = [...urls];
          newUrls[idx] = result.coverUrl;
          props.onChangeMulti(newUrls);
        } else {
          // Original url not found — append as new
          props.onChangeMulti([...urls, result.coverUrl]);
        }
      } else {
        // New image
        props.onChangeMulti([...urls, result.coverUrl]);
      }
    } else {
      props.onChange?.(result.coverUrl);
    }
    setEditorState(null);
  };

  // ── Delete image ──────────────────────────────────────────────────────────
  const handleDelete = async (urlOrIdx: string | number) => {
    if (isMulti && props.onChangeMulti) {
      const urls = props.values ?? [];
      const idx = typeof urlOrIdx === "number" ? urlOrIdx : urls.indexOf(urlOrIdx);
      if (idx < 0) return;
      const url = urls[idx];
      // Best-effort delete from disk + DB
      if (url) await fetch(`/api/blog-images?coverUrl=${encodeURIComponent(url)}`, { method: "DELETE" }).catch(() => {});
      props.onChangeMulti(urls.filter((_, i) => i !== idx));
    } else {
      if (props.value) await fetch(`/api/blog-images?coverUrl=${encodeURIComponent(props.value)}`, { method: "DELETE" }).catch(() => {});
      props.onChange?.("");
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (isMulti) {
    const urls = props.values ?? [];
    return (
      <div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 8 }}>
          {urls.map((url, i) => (
            <ImageThumbnail key={`${url}-${i}`} url={url} aspect={aspect}
              onEdit={() => handleEdit(url)}
              onDelete={() => handleDelete(i)}
              isCover={i === 0} />
          ))}
          <UploadBox aspect={aspect} uploading={uploading} progress={uploadProgress}
            onClick={() => inputRef.current?.click()}
            onDrop={(f) => f && handleFile(f)}
            onCancel={cancelUpload} />
        </div>
        <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
        {urls.length > 0 && <p style={{ fontSize: 10, color: "#2a2a2a", marginTop: 6 }}>รูปแรกจะเป็น Cover หลัก • คลิก ✎ เพื่อแก้ไข</p>}
        {editorState && (
          <PhotoEditor imageUrl={editorState.url} imageId={editorState.id}
            initialEdit={editorState.initialEdit}
            aspectRatio={aspect}
            onSave={handleSave} onClose={() => setEditorState(null)} />
        )}
      </div>
    );
  }

  // Single image mode
  return (
    <div>
      {props.value ? (
        <div style={{ position: "relative", width: props.width ?? "100%", maxWidth: 400 }}>
          <ImageThumbnail url={props.value} aspect={aspect}
            onEdit={() => handleEdit(props.value!)}
            onDelete={() => handleDelete(0)} />
        </div>
      ) : (
        <div style={{ width: props.width ?? "100%", maxWidth: 400 }}>
          <UploadBox aspect={aspect} uploading={uploading} progress={uploadProgress}
            onClick={() => inputRef.current?.click()}
            onDrop={(f) => f && handleFile(f)}
            onCancel={cancelUpload} />
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
      {props.hint && <p style={{ fontSize: 10, color: "#2a2a2a", marginTop: 6 }}>{props.hint}</p>}
      {editorState && (
        <PhotoEditor imageUrl={editorState.url} imageId={editorState.id}
          initialEdit={editorState.initialEdit}
          onSave={handleSave} onClose={() => setEditorState(null)} />
      )}
    </div>
  );
}

// ── Thumbnail with edit/delete overlay ────────────────────────────────────────
function ImageThumbnail({ url, aspect, onEdit, onDelete, isCover }: {
  url: string; aspect: number;
  onEdit: () => void; onDelete: () => void; isCover?: boolean;
}) {
  return (
    <div style={{ position: "relative", aspectRatio: `${aspect}`, borderRadius: 8, overflow: "hidden", border: "1px solid #222", background: "#0a0a0a" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      <button onClick={onEdit} title="แก้ไข"
        style={{ position: "absolute", top: 4, right: 30, width: 22, height: 22, borderRadius: "50%", background: "rgba(0,0,0,0.75)", border: "none", color: "#60a5fa", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✎</button>
      <button onClick={onDelete} title="ลบ"
        style={{ position: "absolute", top: 4, right: 4, width: 22, height: 22, borderRadius: "50%", background: "rgba(0,0,0,0.75)", border: "none", color: "#fff", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
      {isCover && <span style={{ position: "absolute", bottom: 4, left: 4, fontSize: 9, fontWeight: 700, background: "#3b82f6", color: "#fff", padding: "2px 6px", borderRadius: 10 }}>COVER</span>}
    </div>
  );
}

// ── Drag-drop upload box ──────────────────────────────────────────────────────
function UploadBox({ aspect, uploading, progress, onClick, onDrop, onCancel }: {
  aspect: number;
  uploading: boolean;
  progress: number;
  onClick: () => void;
  onDrop: (file: File | null) => void;
  onCancel: () => void;
}) {
  const [drag, setDrag] = useState(false);
  return (
    <div onClick={uploading ? undefined : onClick}
      onDragOver={(e) => { if (!uploading) { e.preventDefault(); setDrag(true); } }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { if (!uploading) { e.preventDefault(); setDrag(false); onDrop(e.dataTransfer.files?.[0] ?? null); } }}
      style={{ aspectRatio: `${aspect}`, borderRadius: 8, border: drag ? "2px dashed #3b82f6" : "2px dashed #333", background: "#111", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: uploading ? "default" : "pointer", gap: 6, position: "relative", padding: 8 }}>
      {uploading ? (
        <>
          <span style={{ fontSize: 11, color: "#60a5fa", fontWeight: 700 }}>กำลังอัปโหลด {progress}%</span>
          <div style={{ width: "70%", maxWidth: 160, height: 4, background: "#222", borderRadius: 2, overflow: "hidden" }}>
            <div style={{ width: `${progress}%`, height: "100%", background: "#3b82f6", transition: "width 0.15s ease-out" }} />
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onCancel(); }}
            style={{ marginTop: 4, fontSize: 10, color: "#666", background: "none", border: "1px solid #2a2a2a", borderRadius: 4, padding: "3px 10px", cursor: "pointer" }}
          >ยกเลิก</button>
        </>
      ) : (
        <>
          <span style={{ fontSize: 22, color: "#333" }}>+</span>
          <span style={{ fontSize: 10, color: "#2a2a2a", fontWeight: 600 }}>เพิ่มรูป</span>
        </>
      )}
    </div>
  );
}
