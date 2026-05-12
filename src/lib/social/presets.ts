// Standard social image presets used by the share image editor.
// width/height are the final exported dimensions. Presets are grouped so the
// UI can render them in collapsible sections.
export type SocialPreset = {
  id: string;
  label: string;
  width: number;
  height: number;
  group: "facebook" | "instagram" | "tiktok" | "twitter" | "linkedin" | "youtube" | "pinterest" | "line" | "general";
};

export const SOCIAL_PRESETS: SocialPreset[] = [
  // Facebook
  { id: "fb-link",     label: "FB Feed Link (1200×630)",        width: 1200, height: 630,  group: "facebook" },
  { id: "fb-square",   label: "FB Feed Square (1200×1200)",      width: 1200, height: 1200, group: "facebook" },
  { id: "fb-portrait", label: "FB Feed Portrait (1080×1350)",    width: 1080, height: 1350, group: "facebook" },
  { id: "fb-story",    label: "FB Story / Reel (1080×1920)",     width: 1080, height: 1920, group: "facebook" },
  { id: "fb-cover",    label: "FB Page Cover (1640×624)",        width: 1640, height: 624,  group: "facebook" },
  { id: "fb-event",    label: "FB Event Cover (1920×1005)",      width: 1920, height: 1005, group: "facebook" },

  // Instagram
  { id: "ig-square",   label: "IG Feed Square (1080×1080)",      width: 1080, height: 1080, group: "instagram" },
  { id: "ig-portrait", label: "IG Feed Portrait (1080×1350)",    width: 1080, height: 1350, group: "instagram" },
  { id: "ig-landscape",label: "IG Feed Landscape (1080×566)",    width: 1080, height: 566,  group: "instagram" },
  { id: "ig-story",    label: "IG Story / Reel (1080×1920)",     width: 1080, height: 1920, group: "instagram" },
  { id: "ig-carousel-sq", label: "IG Carousel Square (1080×1080)", width: 1080, height: 1080, group: "instagram" },

  // TikTok
  { id: "tt-video",    label: "TikTok Video (1080×1920)",        width: 1080, height: 1920, group: "tiktok" },
  { id: "tt-photo",    label: "TikTok Photo (1080×1440)",        width: 1080, height: 1440, group: "tiktok" },

  // Twitter / X
  { id: "tw-card",     label: "X/Twitter Card (1600×900)",       width: 1600, height: 900,  group: "twitter" },
  { id: "tw-portrait", label: "X/Twitter Portrait (1080×1350)",  width: 1080, height: 1350, group: "twitter" },
  { id: "tw-header",   label: "X/Twitter Header (1500×500)",     width: 1500, height: 500,  group: "twitter" },

  // LinkedIn
  { id: "li-post",     label: "LinkedIn Post (1200×627)",        width: 1200, height: 627,  group: "linkedin" },
  { id: "li-square",   label: "LinkedIn Square (1200×1200)",     width: 1200, height: 1200, group: "linkedin" },
  { id: "li-portrait", label: "LinkedIn Portrait (1080×1350)",   width: 1080, height: 1350, group: "linkedin" },
  { id: "li-cover",    label: "LinkedIn Banner (1584×396)",      width: 1584, height: 396,  group: "linkedin" },

  // YouTube
  { id: "yt-thumb",    label: "YouTube Thumbnail (1280×720)",    width: 1280, height: 720,  group: "youtube" },
  { id: "yt-shorts",   label: "YouTube Shorts (1080×1920)",      width: 1080, height: 1920, group: "youtube" },
  { id: "yt-banner",   label: "YouTube Channel Art (2560×1440)", width: 2560, height: 1440, group: "youtube" },

  // Pinterest
  { id: "pin-standard",label: "Pinterest Pin (1000×1500)",       width: 1000, height: 1500, group: "pinterest" },
  { id: "pin-square",  label: "Pinterest Square (1000×1000)",    width: 1000, height: 1000, group: "pinterest" },
  { id: "pin-long",    label: "Pinterest Long (1000×2100)",      width: 1000, height: 2100, group: "pinterest" },
  { id: "pin-story",   label: "Pinterest Story (1080×1920)",     width: 1080, height: 1920, group: "pinterest" },

  // LINE (TH market)
  { id: "line-square", label: "LINE OA Square (1040×1040)",      width: 1040, height: 1040, group: "line" },
  { id: "line-card",   label: "LINE Card (1040×1040)",           width: 1040, height: 1040, group: "line" },
  { id: "line-vca",    label: "LINE VOOM Card (1080×1920)",      width: 1080, height: 1920, group: "line" },
];

export const PRESET_GROUPS: { id: SocialPreset["group"]; label: string; icon: string }[] = [
  { id: "facebook",  label: "Facebook",  icon: "📘" },
  { id: "instagram", label: "Instagram", icon: "📷" },
  { id: "tiktok",    label: "TikTok",    icon: "🎵" },
  { id: "twitter",   label: "X (Twitter)", icon: "𝕏" },
  { id: "linkedin",  label: "LinkedIn",  icon: "💼" },
  { id: "youtube",   label: "YouTube",   icon: "▶️" },
  { id: "pinterest", label: "Pinterest", icon: "📌" },
  { id: "line",      label: "LINE",      icon: "💬" },
];

export function getPreset(id: string): SocialPreset | null {
  return SOCIAL_PRESETS.find(p => p.id === id) ?? null;
}
