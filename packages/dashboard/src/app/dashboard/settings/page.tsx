"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";
import { FadingBorder } from "@/components/FadingBorder";
import { startRegistration } from "@simplewebauthn/browser";
import { AddressInput } from "@/components/AddressInput";

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
    <div style={{ marginBottom: "32px", display: "flex", flexDirection: "column", flex: 1 }}>
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
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <FadingBorder radius="var(--radius-lg)" />
        {children}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { user, token } = useAuth();
  const [passkeyState, setPasskeyState] = useState<"idle" | "registering" | "registered" | "has-passkey" | "error">("idle");
  const [passkeyError, setPasskeyError] = useState("");
  const [passkeyCount, setPasskeyCount] = useState(0);
  const [fullName, setFullName] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const editingRef = useRef(false);

  const saveProfile = useCallback(async () => {
    // Don't save if user is still editing another field
    if (editingRef.current) return;
    const authToken = (token && token !== "cookie") ? token : localStorage.getItem("locker-token");
    if (!authToken) return;
    await fetch("/api/auth/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({ fullName, billingAddress }),
    });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  }, [fullName, billingAddress, token]);

  // Load profile
  useEffect(() => {
    (async () => {
      try {
        const authToken = (token && token !== "cookie") ? token : localStorage.getItem("locker-token");
        if (!authToken) return;
        const res = await fetch("/api/auth/me", { headers: { Authorization: `Bearer ${authToken}` } });
        if (res.ok) {
          const data = await res.json();
          setFullName(data.user.fullName || "");
          setBillingAddress(data.user.billingAddress || "");
        }
      } catch {}
    })();
  }, [token]);

  // Check if user already has passkeys
  useEffect(() => {
    (async () => {
      try {
        const authToken = (token && token !== "cookie") ? token : localStorage.getItem("locker-token");
        if (!authToken) return;
        const res = await fetch("/api/passkeys/count", {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.count > 0) {
            setPasskeyCount(data.count);
            setPasskeyState("has-passkey");
          }
        }
      } catch {}
    })();
  }, [token]);

  async function handleRegisterPasskey() {
    setPasskeyState("registering");
    setPasskeyError("");

    try {
      // Get registration options
      const optRes = await fetch("/api/passkeys/register/options", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token && token !== "cookie" ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!optRes.ok) {
        setPasskeyState("error"); setPasskeyError("Failed to start registration");
        return;
      }

      const options = await optRes.json();

      // Prompt the authenticator
      const regResponse = await startRegistration({ optionsJSON: options });

      // Verify with server
      const verifyRes = await fetch("/api/passkeys/register/verify", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token && token !== "cookie" ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(regResponse),
      });

      if (!verifyRes.ok) {
        const data = await verifyRes.json();
        setPasskeyState("error"); setPasskeyError(data.error || "Registration failed");
        return;
      }

      setPasskeyState("registered");
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "NotAllowedError") {
        setPasskeyState("error"); setPasskeyError("Cancelled");
      } else {
        setPasskeyState("error"); setPasskeyError("Registration failed");
      }
    }
  }

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

      <div style={{ display: "flex", gap: "16px", alignItems: "stretch" }}>
        <div style={{ flex: "3 1 0" }}>
          <SettingsCard title="Account">
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Email + Plan */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "11px", color: "var(--text-tertiary)", fontFamily: "var(--font-body)", marginBottom: "4px", letterSpacing: "0.06em", textTransform: "uppercase" }}>Email</div>
                  <div style={{ fontSize: "15px", fontFamily: "var(--font-body)", fontWeight: 500, color: "var(--text-primary)" }}>{user?.email}</div>
                </div>
                <div style={{ padding: "5px 14px", borderRadius: "100px", background: "rgba(34,197,94,0.08)", color: "var(--success)", fontSize: "12px", fontWeight: 500, fontFamily: "var(--font-body)" }}>Free Plan</div>
              </div>
              {/* Name */}
              <div>
                <label style={{ display: "block", marginBottom: "4px", fontSize: "11px", color: "var(--text-tertiary)", letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "var(--font-body)" }}>Full Name</label>
                <input type="text" value={fullName}
                  onChange={(e) => { setFullName(e.target.value); editingRef.current = true; }}
                  onFocus={() => { editingRef.current = true; }}
                  onBlur={() => { editingRef.current = false; setTimeout(saveProfile, 100); }}
                  placeholder="Your name" autoComplete="name"
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "none", background: "rgba(255,255,255,0.04)", color: "var(--text-primary)", fontFamily: "var(--font-body)", fontSize: "14px", outline: "none" }} />
              </div>
              {/* Address */}
              <div>
                <label style={{ display: "block", marginBottom: "4px", fontSize: "11px", color: "var(--text-tertiary)", letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "var(--font-body)" }}>Billing Address</label>
                <AddressInput value={billingAddress} onChange={(v) => { setBillingAddress(v); editingRef.current = true; }}
                  onBlur={() => { editingRef.current = false; setTimeout(saveProfile, 100); }} />
              </div>
              {/* Saved toast — top right of screen */}
              {profileSaved && (
                <div style={{
                  position: "fixed", top: "72px", right: "40px", zIndex: 200,
                  padding: "8px 18px", borderRadius: "100px",
                  background: "rgba(50,215,75,0.12)", border: "1px solid rgba(50,215,75,0.3)",
                  color: "var(--success)", fontSize: "13px", fontWeight: 500,
                  fontFamily: "var(--font-body)",
                  animation: "fadeIn 200ms ease",
                }}>
                  ✓ Saved
                </div>
              )}
            </div>
          </SettingsCard>
        </div>
        <div style={{ flex: "2 1 0", display: "flex", flexDirection: "column" }}>
          <SettingsCard title="Passkeys">
            <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: "180px" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "14px", fontFamily: "var(--font-body)", fontWeight: 500, marginBottom: "4px" }}>
                  Passwordless sign-in
                </div>
                <div style={{ fontSize: "13px", color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}>
                  Register a passkey to sign in with Face ID, Touch ID, or your security key.
                </div>
              </div>

        <button
          onClick={(passkeyState === "registered" || passkeyState === "has-passkey") ? undefined : handleRegisterPasskey}
          disabled={passkeyState === "registering" || passkeyState === "registered" || passkeyState === "has-passkey"}
          style={{
            alignSelf: "flex-end",
            padding: "10px 20px",
            borderRadius: "10px",
            border: (passkeyState === "registered" || passkeyState === "has-passkey")
              ? "1px solid rgba(50,215,75,0.3)"
              : passkeyState === "error"
              ? "1px solid rgba(239,68,68,0.25)"
              : "none",
            background: (passkeyState === "registered" || passkeyState === "has-passkey")
              ? "rgba(50,215,75,0.12)"
              : passkeyState === "error"
              ? "rgba(239,68,68,0.1)"
              : "#ffffff",
            color: (passkeyState === "registered" || passkeyState === "has-passkey")
              ? "var(--success)"
              : passkeyState === "error"
              ? "var(--error)"
              : "#000000",
            fontFamily: "var(--font-body)",
            fontSize: "13px",
            fontWeight: 600,
            cursor: (passkeyState === "registered" || passkeyState === "has-passkey") ? "default" : "pointer",
            transition: "all 250ms ease",
          }}
        >
          {passkeyState === "registering" && "Registering..."}
          {passkeyState === "registered" && "✓ Passkey Registered"}
          {passkeyState === "has-passkey" && `✓ Passkey Active`}
          {passkeyState === "error" && passkeyError}
          {passkeyState === "idle" && "Register Passkey"}
        </button>
            </div>
          </SettingsCard>
        </div>
      </div>

      <div style={{ display: "flex", gap: "16px", alignItems: "stretch" }}>
        <div style={{ flex: "1 1 0", display: "flex", flexDirection: "column" }}>
          <SettingsCard title="CLI">
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "13px", lineHeight: "2", color: "var(--text-secondary)" }}>
              <CopyLine command="npm install -g locker-cli" comment="Install" />
              <CopyLine command="locker login" comment="Login" />
              <CopyLine command="locker set openai" comment="Store a key" />
              <CopyLine command="locker get openai" comment="Retrieve" />
              <CopyLine command="locker update" comment="Update CLI" />
            </div>
          </SettingsCard>
        </div>
        <div style={{ flex: "1 1 0", display: "flex", flexDirection: "column", gap: "0" }}>
          <SettingsCard title="AI Agent Setup">
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "13px", lineHeight: "2", color: "var(--text-secondary)" }}>
              <CopyLine command="locker mcp install" comment="MCP server (Claude, Cursor)" />
              <CopyLine command="npx skills add carterhamm/locker --skill locker -g" comment="Claude Code skill (global)" />
            </div>
          </SettingsCard>
          <SettingsCard title="Contact">
            <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
              <p style={{ fontSize: "13px", color: "var(--text-tertiary)", fontFamily: "var(--font-body)", marginBottom: "16px" }}>
                Questions, feedback, or partnerships
              </p>
              <button
                style={{
                  display: "flex", alignItems: "center", gap: "7px",
                  padding: "8px 18px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#ffffff",
                  color: "#000000",
                  fontFamily: "var(--font-body)",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 150ms ease",
                  flexShrink: 0,
                  alignSelf: "flex-end",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M22 4L12 13L2 4" />
                </svg>
                Email Us
              </button>
            </div>
          </SettingsCard>
        </div>
      </div>
    </div>
  );
}
