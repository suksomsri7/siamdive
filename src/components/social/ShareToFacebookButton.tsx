"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";

// Lazy-load the heavy drawer only when the admin opens it
const ShareDrawer = dynamic(() => import("./ShareDrawer"), { ssr: false });

export default function ShareToFacebookButton({
  blogId,
  language,
  defaultImage,
  blogTitle,
  blogExcerpt,
  blogSlug,
}: {
  blogId: string;
  language: string;
  defaultImage?: string;
  blogTitle: string;
  blogExcerpt: string;
  blogSlug: string;
}) {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);

  if (status !== "authenticated" || !session) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          position: "fixed",
          top: 16,
          right: 16,
          zIndex: 60,
          background: "rgba(24,119,242,0.92)",
          color: "#fff",
          border: "none",
          borderRadius: 999,
          padding: "10px 16px",
          fontSize: 13,
          fontWeight: 700,
          cursor: "pointer",
          boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          backdropFilter: "blur(8px)",
        }}
        aria-label="Share to Facebook via Buffer"
      >
        <span style={{ fontSize: 16 }}>📤</span>
        <span>โพส FB</span>
      </button>
      {open && (
        <ShareDrawer
          blogId={blogId}
          language={language}
          defaultImage={defaultImage}
          blogTitle={blogTitle}
          blogExcerpt={blogExcerpt}
          blogSlug={blogSlug}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
