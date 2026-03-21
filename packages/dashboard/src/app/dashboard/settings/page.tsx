"use client";

import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/components/AuthProvider";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const isTerminal = theme === "terminal";

  return (
    <div>
      {isTerminal ? (
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "13px", marginBottom: "16px" }}>
          <span style={{ color: "var(--text-accent)" }}>$</span> locker config
        </div>
      ) : (
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "24px", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "32px" }}>
          Settings
        </h1>
      )}

      {/* Account Section */}
      <div style={{ marginBottom: isTerminal ? "24px" : "40px" }}>
        {isTerminal ? (
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", marginBottom: "12px", color: "var(--text-accent)" }}>
            ## ACCOUNT
          </div>
        ) : (
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "16px", fontWeight: 600, marginBottom: "16px", color: "var(--text-secondary)" }}>
            Account
          </h2>
        )}

        <div
          style={{
            padding: isTerminal ? "12px 16px" : "20px 24px",
            borderRadius: isTerminal ? "4px" : "var(--radius-lg)",
            border: "1px solid var(--border-subtle)",
            background: "var(--bg-card)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: isTerminal ? "12px" : "13px", color: "var(--text-secondary)", fontFamily: "var(--font-body)", marginBottom: "2px" }}>
                {isTerminal ? "EMAIL:" : "Email"}
              </div>
              <div style={{ fontSize: isTerminal ? "13px" : "15px", fontFamily: "var(--font-body)", fontWeight: 500, color: isTerminal ? "var(--text-accent)" : "var(--text-primary)" }}>
                {user?.email}
              </div>
            </div>
            {!isTerminal && (
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
            )}
          </div>
          {isTerminal && (
            <div style={{ marginTop: "8px", fontSize: "12px", color: "var(--text-tertiary)" }}>
              PLAN: free (3 services, 100 fetches/mo)
            </div>
          )}
        </div>
      </div>

      {/* Appearance Section — Terminal Mode account setting */}
      <div style={{ marginBottom: isTerminal ? "24px" : "40px" }}>
        {isTerminal ? (
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", marginBottom: "12px", color: "var(--text-accent)" }}>
            ## APPEARANCE
          </div>
        ) : (
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "16px", fontWeight: 600, marginBottom: "16px", color: "var(--text-secondary)" }}>
            Appearance
          </h2>
        )}

        <div
          style={{
            padding: isTerminal ? "12px 16px" : "20px 24px",
            borderRadius: isTerminal ? "4px" : "var(--radius-lg)",
            border: "1px solid var(--border-subtle)",
            background: "var(--bg-card)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isTerminal ? "12px" : "20px" }}>
            <div>
              <div style={{ fontSize: isTerminal ? "13px" : "15px", fontFamily: "var(--font-body)", fontWeight: 500, marginBottom: "2px" }}>
                {isTerminal ? "THEME" : "Interface Theme"}
              </div>
              <div style={{ fontSize: isTerminal ? "12px" : "13px", color: "var(--text-secondary)" }}>
                {isTerminal
                  ? "Switch between modern and terminal UI"
                  : "Choose how Locker looks across all pages"}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => setTheme("modern")}
              style={{
                flex: 1,
                padding: isTerminal ? "10px" : "16px",
                borderRadius: isTerminal ? "4px" : "var(--radius-md)",
                border: `2px solid ${theme === "modern" ? "var(--accent)" : "var(--border-subtle)"}`,
                background: theme === "modern" ? "var(--accent-glow)" : "var(--bg-input)",
                cursor: "pointer",
                textAlign: "center",
              }}
            >
              <div style={{
                fontSize: isTerminal ? "18px" : "24px",
                marginBottom: "8px",
              }}>
                {isTerminal ? "[M]" : "\u2728"}
              </div>
              <div style={{
                fontFamily: "var(--font-body)",
                fontSize: isTerminal ? "12px" : "13px",
                fontWeight: 600,
                color: theme === "modern" ? "var(--text-accent)" : "var(--text-secondary)",
                letterSpacing: isTerminal ? "1px" : "0",
              }}>
                {isTerminal ? "MODERN" : "Modern"}
              </div>
              <div style={{
                fontSize: isTerminal ? "11px" : "12px",
                color: "var(--text-tertiary)",
                marginTop: "4px",
              }}>
                {isTerminal ? "glass + gradients" : "Glass, gradients, premium feel"}
              </div>
            </button>

            <button
              onClick={() => setTheme("terminal")}
              style={{
                flex: 1,
                padding: isTerminal ? "10px" : "16px",
                borderRadius: isTerminal ? "4px" : "var(--radius-md)",
                border: `2px solid ${theme === "terminal" ? "var(--accent)" : "var(--border-subtle)"}`,
                background: theme === "terminal" ? "var(--accent-glow)" : "var(--bg-input)",
                cursor: "pointer",
                textAlign: "center",
              }}
            >
              <div style={{
                fontSize: isTerminal ? "18px" : "24px",
                marginBottom: "8px",
                fontFamily: "var(--font-mono)",
              }}>
                {isTerminal ? "[T]" : ">_"}
              </div>
              <div style={{
                fontFamily: "var(--font-body)",
                fontSize: isTerminal ? "12px" : "13px",
                fontWeight: 600,
                color: theme === "terminal" ? "var(--text-accent)" : "var(--text-secondary)",
                letterSpacing: isTerminal ? "1px" : "0",
              }}>
                {isTerminal ? "TERMINAL" : "Terminal"}
              </div>
              <div style={{
                fontSize: isTerminal ? "11px" : "12px",
                color: "var(--text-tertiary)",
                marginTop: "4px",
              }}>
                {isTerminal ? "monospace + green" : "macOS Terminal aesthetic"}
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* CLI Section */}
      <div>
        {isTerminal ? (
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", marginBottom: "12px", color: "var(--text-accent)" }}>
            ## CLI QUICK START
          </div>
        ) : (
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "16px", fontWeight: 600, marginBottom: "16px", color: "var(--text-secondary)" }}>
            CLI Quick Start
          </h2>
        )}

        <div
          style={{
            padding: isTerminal ? "16px" : "24px",
            borderRadius: isTerminal ? "4px" : "var(--radius-lg)",
            border: "1px solid var(--border-subtle)",
            background: isTerminal ? "#1a1a1a" : "var(--bg-tertiary)",
            fontFamily: "var(--font-mono)",
            fontSize: isTerminal ? "12px" : "13px",
            lineHeight: "2",
            color: "var(--text-secondary)",
          }}
        >
          <div><span style={{ color: "var(--text-tertiary)" }}># Install</span></div>
          <div style={{ color: "var(--text-primary)" }}>npm install -g locker-cli</div>
          <div style={{ marginTop: "8px" }}><span style={{ color: "var(--text-tertiary)" }}># Login</span></div>
          <div style={{ color: "var(--text-primary)" }}>locker login</div>
          <div style={{ marginTop: "8px" }}><span style={{ color: "var(--text-tertiary)" }}># Store a key</span></div>
          <div style={{ color: "var(--text-primary)" }}>locker set openai sk-proj-...</div>
          <div style={{ marginTop: "8px" }}><span style={{ color: "var(--text-tertiary)" }}># Retrieve (agents call this)</span></div>
          <div style={{ color: "var(--text-primary)" }}>locker get openai</div>
        </div>
      </div>
    </div>
  );
}
