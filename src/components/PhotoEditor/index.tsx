"use client";

import dynamic from "next/dynamic";

// Dynamic import — Konva uses browser canvas, must NOT be SSR'd
const PhotoEditor = dynamic(() => import("./PhotoEditor"), {
  ssr: false,
  loading: () => (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.95)", zIndex: 9999,
      display: "flex", alignItems: "center", justifyContent: "center", color: "#666", fontSize: 13,
    }}>กำลังโหลด...</div>
  ),
});

export default PhotoEditor;
export type { EditJson, TextLayer } from "./PhotoEditor";
