import type { ImageLoaderProps } from "next/image";

const BUNNY_CDN = "https://siamdive-cdn.b-cdn.net";

export default function bunnyLoader({ src, width, quality }: ImageLoaderProps): string {
  const q = quality ?? 75;

  if (src.startsWith("/uploads/")) {
    return `${BUNNY_CDN}${src}?width=${width}&quality=${q}&format=auto`;
  }

  if (src.startsWith(BUNNY_CDN)) {
    const url = new URL(src);
    url.searchParams.set("width", String(width));
    url.searchParams.set("quality", String(q));
    url.searchParams.set("format", "auto");
    return url.toString();
  }

  return src;
}
