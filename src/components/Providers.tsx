"use client";

import { Suspense } from "react";
import { SessionProvider } from "next-auth/react";
import LangSetter from "./LangSetter";
import AnalyticsProvider from "./AnalyticsProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <LangSetter />
      <Suspense fallback={null}>
        <AnalyticsProvider />
      </Suspense>
      {children}
    </SessionProvider>
  );
}
