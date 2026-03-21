"use client";

import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/components/AuthProvider";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
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

      {/* Appearance Section — theme selector kept for future use */}
      <div style={{ marginBottom: "40px" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "16px", fontWeight: 600, marginBottom: "16px", color: "var(--text-secondary)" }}>
          Appearance
        </h2>

        <div
          style={{
            padding: "20px 24px",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border-subtle)",
            background: "var(--bg-card)",
          }}
        >
          <div style={{ marginBottom: "20px" }}>
            <div style={{ fontSize: "15px", fontFamily: "var(--font-body)", fontWeight: 500, marginBottom: "2px" }}>
              Interface Theme
            </div>
            <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
              Choose how Locker looks across all pages
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => setTheme("modern")}
              style={{
                flex: 1,
                padding: "16px",
                borderRadius: "var(--radius-md)",
                border: `2px solid ${theme === "modern" ? "var(--accent)" : "var(--border-subtle)"}`,
                background: theme === "modern" ? "var(--accent-glow)" : "var(--bg-input)",
                cursor: "pointer",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "24px", marginBottom: "8px" }}>{"\u2728"}</div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: "13px", fontWeight: 600, color: theme === "modern" ? "var(--text-accent)" : "var(--text-secondary)" }}>
                Modern
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-tertiary)", marginTop: "4px" }}>
                Glass, gradients, premium feel
              </div>
            </button>

            <button
              onClick={() => setTheme("terminal")}
              style={{
                flex: 1,
                padding: "16px",
                borderRadius: "var(--radius-md)",
                border: `2px solid ${theme === "terminal" ? "var(--accent)" : "var(--border-subtle)"}`,
                background: theme === "terminal" ? "var(--accent-glow)" : "var(--bg-input)",
                cursor: "pointer",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "24px", marginBottom: "8px", fontFamily: "var(--font-mono)" }}>{">_"}</div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: "13px", fontWeight: 600, color: theme === "terminal" ? "var(--text-accent)" : "var(--text-secondary)" }}>
                Terminal
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-tertiary)", marginTop: "4px" }}>
                macOS Terminal aesthetic
              </div>
            </button>
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
