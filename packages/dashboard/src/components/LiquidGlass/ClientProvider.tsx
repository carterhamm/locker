"use client";

import { LiquidGlassProvider } from "./LiquidGlassContext";

export function LGProvider({ children }: { children: React.ReactNode }) {
  return <LiquidGlassProvider>{children}</LiquidGlassProvider>;
}
