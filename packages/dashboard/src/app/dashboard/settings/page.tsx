"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { FadingBorder } from "@/components/FadingBorder";
import { startRegistration } from "@simplewebauthn/browser";

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
  const { user, token } = useAuth();
  const [passkeyState, setPasskeyState] = useState<"idle" | "registering" | "registered" | "has-passkey" | "error">("idle");
  const [passkeyError, setPasskeyError] = useState("");
  const [passkeyCount, setPasskeyCount] = useState(0);
  const [fullName, setFullName] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);

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

      <SettingsCard title="Profile">
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ display: "flex", gap: "12px" }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: "4px", fontSize: "11px", color: "var(--text-tertiary)", letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "var(--font-body)" }}>Full Name</label>
              <input type="text" value={fullName} onChange={(e) => { setFullName(e.target.value); setProfileSaved(false); }} placeholder="Your name" autoComplete="name" style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "none", background: "rgba(255,255,255,0.04)", color: "var(--text-primary)", fontFamily: "var(--font-body)", fontSize: "14px", outline: "none" }} />
            </div>
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "4px", fontSize: "11px", color: "var(--text-tertiary)", letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "var(--font-body)" }}>Billing Address</label>
            <input type="text" value={billingAddress} onChange={(e) => { setBillingAddress(e.target.value); setProfileSaved(false); }} placeholder="123 Main St, City, State ZIP" autoComplete="street-address" style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "none", background: "rgba(255,255,255,0.04)", color: "var(--text-primary)", fontFamily: "var(--font-body)", fontSize: "14px", outline: "none" }} />
          </div>
          <button
            onClick={async () => {
              const authToken = (token && token !== "cookie") ? token : localStorage.getItem("locker-token");
              await fetch("/api/auth/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json", ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) },
                body: JSON.stringify({ fullName, billingAddress }),
              });
              setProfileSaved(true);
              setTimeout(() => setProfileSaved(false), 3000);
            }}
            style={{
              padding: "8px 20px", borderRadius: "8px", border: "none", alignSelf: "flex-start",
              background: profileSaved ? "rgba(50,215,75,0.12)" : "#ffffff",
              color: profileSaved ? "var(--success)" : "#000000",
              fontFamily: "var(--font-body)", fontSize: "13px", fontWeight: 600, cursor: "pointer",
              transition: "all 250ms ease",
            }}
          >
            {profileSaved ? "✓ Saved" : "Save Profile"}
          </button>
        </div>
      </SettingsCard>

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

      <SettingsCard title="Passkeys">
        <div style={{ marginBottom: "16px" }}>
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
