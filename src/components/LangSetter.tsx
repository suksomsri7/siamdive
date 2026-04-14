"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const VALID = ["en", "th", "cn", "ja", "ko", "de", "fr", "ru"];

export default function LangSetter() {
  const pathname = usePathname();

  useEffect(() => {
    const seg = pathname.split("/")[1];
    const lang = VALID.includes(seg) ? seg : "th";
    document.documentElement.lang = lang;
  }, [pathname]);

  return null;
}
