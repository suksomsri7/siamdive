"use client";

// Fires BLOG_VIEW on mount and BLOG_READ_COMPLETE once when the user has
// scrolled ≥ 80% AND spent ≥ 30s on the page. Both signals together mean the
// person actually read the piece instead of bouncing.

import { useEffect, useRef } from "react";
import { trackBlogView, trackBlogReadComplete } from "@/lib/analytics/client";

const READ_COMPLETE_SCROLL_PCT = 80;
const READ_COMPLETE_DWELL_MS = 30_000;

export default function BlogReadTracker({ blogId, lang }: { blogId: string; lang?: string }) {
  const startTs = useRef<number>(0);
  const maxScroll = useRef<number>(0);
  const emitted = useRef<boolean>(false);

  useEffect(() => {
    startTs.current = Date.now();
    trackBlogView(blogId, { lang });

    const onScroll = () => {
      const scrollY = window.scrollY;
      const docH = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const pct = Math.min(100, Math.round((scrollY / docH) * 100));
      if (pct > maxScroll.current) maxScroll.current = pct;

      if (
        !emitted.current &&
        maxScroll.current >= READ_COMPLETE_SCROLL_PCT &&
        Date.now() - startTs.current >= READ_COMPLETE_DWELL_MS
      ) {
        emitted.current = true;
        trackBlogReadComplete(blogId, Date.now() - startTs.current, maxScroll.current);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    const i = window.setInterval(onScroll, 5000);  // catch dwell threshold without scroll
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.clearInterval(i);
    };
  }, [blogId, lang]);

  return null;
}
