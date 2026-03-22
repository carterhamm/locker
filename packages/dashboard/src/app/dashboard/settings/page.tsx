"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { FadingBorder } from "@/components/FadingBorder";

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

function SettingsCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "32px" }}>
      <h2 style={{
        fontFamily: "var(--font-body)",
        fontSize: "11px",
        fontWeight: 600,
        marginBottom: "12px",
        color: "var(--text-tertiary)",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
      }}>
        {title}
      </h2>
      <div
        style={{
          padding: "22px 24px",
          borderRadius: "var(--radius-lg)",
          background: "rgba(255,255,255,0.02)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <FadingBorder radius="var(--radius-lg)" />
        {children}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div>
      <div style={{ marginBottom: "32px" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 600, letterSpacing: "-0.01em", marginBottom: "6px" }}>
          Settings
        </h2>
        <p style={{ color: "var(--text-tertiary)", fontSize: "13px", fontFamily: "var(--font-body)" }}>
          Manage your account and preferences.
        </p>
      </div>

      <SettingsCard title="Account">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "11px", color: "var(--text-tertiary)", fontFamily: "var(--font-body)", marginBottom: "4px", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Email
            </div>
            <div style={{ fontSize: "15px", fontFamily: "var(--font-body)", fontWeight: 500, color: "var(--text-primary)" }}>
              {user?.email}
            </div>
          </div>
          <div
            style={{
              padding: "5px 14px",
              borderRadius: "100px",
              background: "rgba(34,197,94,0.08)",
              color: "var(--success)",
              fontSize: "12px",
              fontWeight: 500,
              fontFamily: "var(--font-body)",
            }}
          >
            Free Plan
          </div>
        </div>
      </SettingsCard>

      <SettingsCard title="CLI Quick Start">
        <div
          style={{
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
      </SettingsCard>
    </div>
  );
}
