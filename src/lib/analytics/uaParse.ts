// Minimal UA parser. We intentionally never store the raw UA — just the
// derived triplet (device, os, browser). This keeps fingerprinting surface
// area low while still enabling "mobile vs desktop" analytics.

export type UaInfo = { device: string; os: string; browser: string };

const UNKNOWN: UaInfo = { device: "unknown", os: "unknown", browser: "unknown" };

export function parseUa(ua: string | null | undefined): UaInfo {
  if (!ua) return UNKNOWN;
  const s = ua.toLowerCase();

  // Device
  let device = "desktop";
  if (/ipad|tablet|kindle|playbook/.test(s)) device = "tablet";
  else if (/mobi|iphone|ipod|android.+mobile|phone/.test(s)) device = "mobile";

  // OS
  let os = "unknown";
  if (/windows nt 10/.test(s)) os = "Windows 10";
  else if (/windows nt 11/.test(s)) os = "Windows 11";
  else if (/windows/.test(s)) os = "Windows";
  else if (/mac os x ([\d_]+)/.test(s)) {
    const m = s.match(/mac os x ([\d_]+)/);
    os = m ? `macOS ${m[1].replace(/_/g, ".")}` : "macOS";
  } else if (/iphone|ipad|ipod/.test(s)) {
    const m = s.match(/os ([\d_]+)/);
    os = m ? `iOS ${m[1].replace(/_/g, ".")}` : "iOS";
  } else if (/android ([\d.]+)/.test(s)) {
    const m = s.match(/android ([\d.]+)/);
    os = m ? `Android ${m[1]}` : "Android";
  } else if (/linux/.test(s)) os = "Linux";

  // Browser
  let browser = "unknown";
  if (/edg\//.test(s)) {
    const m = s.match(/edg\/([\d.]+)/);
    browser = m ? `Edge ${m[1].split(".")[0]}` : "Edge";
  } else if (/opr\//.test(s) || /opera/.test(s)) {
    browser = "Opera";
  } else if (/firefox\//.test(s)) {
    const m = s.match(/firefox\/([\d.]+)/);
    browser = m ? `Firefox ${m[1].split(".")[0]}` : "Firefox";
  } else if (/chrome\//.test(s) && !/edg|opr/.test(s)) {
    const m = s.match(/chrome\/([\d.]+)/);
    browser = m ? `Chrome ${m[1].split(".")[0]}` : "Chrome";
  } else if (/safari\//.test(s) && !/chrome|chromium|edg/.test(s)) {
    const m = s.match(/version\/([\d.]+)/);
    browser = m ? `Safari ${m[1].split(".")[0]}` : "Safari";
  }

  return { device, os, browser };
}
