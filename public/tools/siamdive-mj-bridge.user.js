// ==UserScript==
// @name         SiamDive ↔ Midjourney Bridge
// @namespace    https://siamdive.com/
// @version      1.0.0
// @description  Send Midjourney images directly to SiamDive backoffice — no download/upload step.
// @author       SiamDive
// @match        https://www.midjourney.com/*
// @match        https://alpha.midjourney.com/*
// @match        https://legacy.midjourney.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @connect      siamdive.com
// @run-at       document-idle
// @updateURL    https://siamdive.com/tools/siamdive-mj-bridge.user.js
// @downloadURL  https://siamdive.com/tools/siamdive-mj-bridge.user.js
// ==/UserScript==

/* eslint-disable no-undef */
(function () {
  "use strict";

  const API_BASE = "https://siamdive.com";
  const STORAGE_KEY = "siamdive_api_key";
  const LAST_BLOG_KEY = "siamdive_last_blog_id";

  function getApiKey() {
    let key = GM_getValue(STORAGE_KEY, "");
    if (!key) {
      key = prompt(
        "Paste your SiamDive API key (starts with 'sk_')\n\n" +
        "ดูได้ที่ siamdive.com/backoffice/api-keys (ต้องมี permission upload.write)"
      );
      if (key) GM_setValue(STORAGE_KEY, key.trim());
    }
    return key ? key.trim() : "";
  }

  function getLastBlogId() {
    return GM_getValue(LAST_BLOG_KEY, "");
  }
  function setLastBlogId(id) {
    GM_setValue(LAST_BLOG_KEY, id);
  }

  function postFromUrl({ url, blogId, apiKey }) {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: "POST",
        url: `${API_BASE}/api/blog-images/from-url`,
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
        },
        data: JSON.stringify({ url, blogId: blogId || undefined, modelLabel: "midjourney" }),
        onload: (r) => {
          try {
            const data = JSON.parse(r.responseText);
            if (r.status >= 200 && r.status < 300) resolve(data);
            else reject(new Error(data?.error || `HTTP ${r.status}`));
          } catch (e) {
            reject(new Error(`Parse error: ${e.message}`));
          }
        },
        onerror: () => reject(new Error("Network error")),
      });
    });
  }

  function findImageUrl(imgEl) {
    // Prefer the upscaled / largest source if available
    const src = imgEl.currentSrc || imgEl.src || "";
    if (!src) return null;
    if (!/cdn\.midjourney\.com|s\.mj\.run/.test(src)) return null;
    // Strip resize/transform query params — MJ serves multiple sizes via querystring.
    // Bunny → siamdive will pick its own dimensions.
    return src.split("?")[0];
  }

  async function handleSend(imgEl, btn) {
    const url = findImageUrl(imgEl);
    if (!url) {
      flash(btn, "❌ not MJ", "#ef4444");
      return;
    }
    const apiKey = getApiKey();
    if (!apiKey) {
      flash(btn, "❌ no key", "#ef4444");
      return;
    }
    const last = getLastBlogId();
    const blogId = prompt(
      "Blog ID to attach (leave empty to upload as orphan, attach later in backoffice):",
      last
    );
    if (blogId === null) return; // user cancelled
    if (blogId) setLastBlogId(blogId.trim());

    btn.textContent = "⏳ uploading…";
    btn.style.background = "rgba(236,72,153,0.4)";
    try {
      const data = await postFromUrl({ url, blogId: blogId.trim(), apiKey });
      flash(btn, `✅ ${data.id.slice(0, 8)}`, "#10b981");
    } catch (e) {
      console.error("[SiamDive] upload failed:", e);
      flash(btn, `❌ ${e.message.slice(0, 40)}`, "#ef4444");
    }
  }

  function flash(btn, text, color) {
    btn.textContent = text;
    btn.style.background = color;
    setTimeout(() => {
      btn.textContent = "📤 SiamDive";
      btn.style.background = "rgba(236,72,153,0.85)";
    }, 3500);
  }

  function attachButton(imgEl) {
    if (imgEl.dataset.sdAttached === "1") return;
    if (!findImageUrl(imgEl)) return;
    imgEl.dataset.sdAttached = "1";

    // We need a positioned ancestor. Walk up to find one.
    let parent = imgEl.parentElement;
    let depth = 0;
    while (parent && depth < 4) {
      const cs = getComputedStyle(parent);
      if (cs.position !== "static") break;
      parent = parent.parentElement;
      depth++;
    }
    if (!parent) parent = imgEl.parentElement;
    if (!parent) return;
    if (getComputedStyle(parent).position === "static") {
      parent.style.position = "relative";
    }

    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = "📤 SiamDive";
    btn.dataset.sdBridgeBtn = "1";
    Object.assign(btn.style, {
      position: "absolute",
      top: "8px",
      right: "8px",
      zIndex: "999999",
      padding: "6px 10px",
      borderRadius: "999px",
      border: "1px solid rgba(255,255,255,0.25)",
      background: "rgba(236,72,153,0.85)",
      color: "#fff",
      fontFamily: "ui-sans-serif, system-ui, sans-serif",
      fontSize: "11px",
      fontWeight: "700",
      cursor: "pointer",
      boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
      backdropFilter: "blur(4px)",
      letterSpacing: "0.02em",
    });
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
      handleSend(imgEl, btn);
    });
    parent.appendChild(btn);
  }

  function scan() {
    document.querySelectorAll("img").forEach(attachButton);
  }

  // Initial scan + watch for new images (MJ is a SPA — content streams in)
  scan();
  const obs = new MutationObserver(() => scan());
  obs.observe(document.body, { childList: true, subtree: true });

  // Reset key shortcut: triple-click anywhere with Shift held to clear stored key
  let clicks = 0;
  let timer = null;
  document.addEventListener("click", (e) => {
    if (!e.shiftKey) return;
    clicks++;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => { clicks = 0; }, 800);
    if (clicks >= 3) {
      clicks = 0;
      if (confirm("Reset SiamDive API key + remembered blog id?")) {
        GM_setValue(STORAGE_KEY, "");
        GM_setValue(LAST_BLOG_KEY, "");
        alert("Cleared. Next upload will prompt for the key again.");
      }
    }
  });

  console.log("[SiamDive ↔ MJ Bridge] active. shift+triple-click anywhere to reset key.");
})();
