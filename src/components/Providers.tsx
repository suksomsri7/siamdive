"use client";

import { SessionProvider } from "next-auth/react";
import LangSetter from "./LangSetter";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <LangSetter />
      {children}
    </SessionProvider>
  );
}
