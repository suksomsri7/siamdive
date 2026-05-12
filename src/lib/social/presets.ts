// Standard social image presets used by the share image editor.
// width/height are the final exported dimensions.
export type SocialPreset = {
  id: string;
  label: string;
  width: number;
  height: number;
  group: "facebook" | "instagram" | "twitter" | "general";
};

export const SOCIAL_PRESETS: SocialPreset[] = [
  { id: "fb-link",     label: "FB Feed Link (1200×630)", width: 1200, height: 630,  group: "facebook" },
  { id: "fb-square",   label: "FB Feed Square (1200×1200)", width: 1200, height: 1200, group: "facebook" },
  { id: "fb-portrait", label: "FB Feed Portrait (1080×1350)", width: 1080, height: 1350, group: "facebook" },
  { id: "fb-story",    label: "FB Story (1080×1920)", width: 1080, height: 1920, group: "facebook" },
  { id: "ig-square",   label: "IG Feed Square (1080×1080)", width: 1080, height: 1080, group: "instagram" },
  { id: "ig-portrait", label: "IG Feed Portrait (1080×1350)", width: 1080, height: 1350, group: "instagram" },
  { id: "ig-story",    label: "IG Story / Reel (1080×1920)", width: 1080, height: 1920, group: "instagram" },
  { id: "tw-card",     label: "Twitter / X Card (1600×900)", width: 1600, height: 900,  group: "twitter" },
];

export function getPreset(id: string): SocialPreset | null {
  return SOCIAL_PRESETS.find(p => p.id === id) ?? null;
}
