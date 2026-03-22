"use client";

import { useEffect, useState } from "react";
import { LockerLogo } from "./Icons";

export function MobileGate({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const check = window.innerWidth < 768;
    setIsMobile(check);
    setChecked(true);
  }, []);

  if (!checked) return null;

  if (isMobile) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 24px",
          background: "#000",
          textAlign: "center",
        }}
      >
        <LockerLogo size={80} />
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "24px",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            marginTop: "24px",
            marginBottom: "8px",
          }}
        >
          Locker
        </h1>
        <p
          style={{
            color: "rgba(255,255,255,0.5)",
            fontSize: "15px",
            fontFamily: "var(--font-body)",
            lineHeight: "1.6",
            maxWidth: "280px",
            marginBottom: "32px",
          }}
        >
          Locker is available on desktop only. Open this page on your computer to manage your API keys.
        </p>
        <div
          style={{
            padding: "10px 24px",
            borderRadius: "100px",
            background: "rgba(255,255,255,0.06)",
            color: "rgba(255,255,255,0.4)",
            fontSize: "13px",
            fontFamily: "var(--font-body)",
            fontWeight: 500,
          }}
        >
          Desktop only
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
