"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";

function CopyLine({ command, comment }: { command: string; comment: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try { await navigator.clipboard.writeText(command); } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ marginBottom: "4px" }}>
      <div><span style={{ color: "var(--text-tertiary)" }}># {comment}</span></div>
      <div
        onClick={handleCopy}
        style={{
          color: "var(--text-primary)",
          cursor: "pointer",
          padding: "2px 6px",
          margin: "0 -6px",
          borderRadius: "4px",
          transition: "background 150ms ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: copied ? "rgba(50,215,75,0.08)" : "transparent",
        }}
        onMouseEnter={(e) => { if (!copied) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
        onMouseLeave={(e) => { if (!copied) e.currentTarget.style.background = "transparent"; }}
      >
        <span>{command}</span>
        {copied && <span style={{ fontSize: "11px", color: "#32d74b", fontWeight: 500 }}>copied</span>}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "24px", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "32px" }}>
        Settings
      </h1>

      {/* Account Section */}
      <div style={{ marginBottom: "40px" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "16px", fontWeight: 600, marginBottom: "16px", color: "var(--text-secondary)" }}>
          Account
        </h2>

        <div
          style={{
            padding: "20px 24px",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border-subtle)",
            background: "var(--bg-card)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "13px", color: "var(--text-secondary)", fontFamily: "var(--font-body)", marginBottom: "2px" }}>
                Email
              </div>
              <div style={{ fontSize: "15px", fontFamily: "var(--font-body)", fontWeight: 500, color: "var(--text-primary)" }}>
                {user?.email}
              </div>
            </div>
            <div
              style={{
                padding: "4px 12px",
                borderRadius: "var(--radius-sm)",
                background: "rgba(34,197,94,0.1)",
                color: "var(--success)",
                fontSize: "12px",
                fontWeight: 500,
              }}
            >
              Free Plan
            </div>
          </div>
        </div>
      </div>

      {/* CLI Section */}
      <div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "16px", fontWeight: 600, marginBottom: "16px", color: "var(--text-secondary)" }}>
          CLI Quick Start
        </h2>

        <div
          style={{
            padding: "24px",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border-subtle)",
            background: "var(--bg-tertiary)",
            fontFamily: "var(--font-mono)",
            fontSize: "13px",
            lineHeight: "2",
            color: "var(--text-secondary)",
          }}
        >
          <CopyLine command="npm install -g locker-cli" comment="Install" />
          <CopyLine command="locker login" comment="Login" />
          <CopyLine command="locker set openai sk-proj-..." comment="Store a key" />
          <CopyLine command="locker get openai" comment="Retrieve (agents call this)" />
        </div>
      </div>
    </div>
  );
}
