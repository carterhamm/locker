"use client";

import { useState, useEffect, FormEvent } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/components/AuthProvider";

interface StoredKey {
  service: string;
  createdAt: string;
  lastUsed: string | null;
}

export default function KeysPage() {
  const { theme } = useTheme();
  const { token } = useAuth();
  const isTerminal = theme === "terminal";

  const [keys, setKeys] = useState<StoredKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newService, setNewService] = useState("");
  const [newKey, setNewKey] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function fetchKeys() {
    try {
      const res = await fetch("/api/keys", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setKeys(data.services || []);
      }
    } catch {
      setError("Failed to load keys");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) fetchKeys();
  }, [token]);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ service: newService, key: newKey }),
      });
      if (res.ok) {
        setSuccess(`Key stored for ${newService}`);
        setNewService("");
        setNewKey("");
        setShowAdd(false);
        fetchKeys();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to store key");
      }
    } catch {
      setError("Network error");
    }
  }

  async function handleRevoke(service: string) {
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/keys/${encodeURIComponent(service)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setSuccess(`Key revoked for ${service}`);
        fetchKeys();
      }
    } catch {
      setError("Failed to revoke key");
    }
  }

  if (loading) {
    return (
      <div style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)", padding: "40px 0" }}>
        {isTerminal ? "Loading keys..." : "Loading..."}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isTerminal ? "16px" : "32px" }}>
        {isTerminal ? (
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "13px" }}>
            <span style={{ color: "var(--text-accent)" }}>$</span> locker list
          </div>
        ) : (
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "24px", fontWeight: 700, letterSpacing: "-0.02em" }}>
            API Keys
          </h1>
        )}

        <button
          onClick={() => setShowAdd(!showAdd)}
          style={{
            padding: isTerminal ? "4px 12px" : "8px 20px",
            borderRadius: isTerminal ? "4px" : "var(--radius-md)",
            border: isTerminal ? "1px solid var(--border-accent)" : "none",
            background: isTerminal ? "transparent" : "#ffffff",
            color: isTerminal ? "var(--text-accent)" : "#000000",
            fontFamily: "var(--font-body)",
            fontSize: isTerminal ? "12px" : "13px",
            fontWeight: 600,
            cursor: "pointer",
            letterSpacing: isTerminal ? "1px" : "0.02em",
          }}
        >
          {isTerminal ? (showAdd ? "CANCEL" : "+ ADD KEY") : showAdd ? "Cancel" : "Add Key"}
        </button>
      </div>

      {/* Status messages */}
      {error && (
        <div style={{
          padding: isTerminal ? "8px 12px" : "10px 16px",
          borderRadius: isTerminal ? "4px" : "var(--radius-sm)",
          background: isTerminal ? "transparent" : "rgba(239,68,68,0.1)",
          border: `1px solid ${isTerminal ? "#ff5f57" : "rgba(239,68,68,0.2)"}`,
          color: isTerminal ? "#ff5f57" : "var(--error)",
          fontSize: "13px",
          marginBottom: "16px",
          fontFamily: "var(--font-body)",
        }}>
          {isTerminal ? `Error: ${error}` : error}
        </div>
      )}
      {success && (
        <div style={{
          padding: isTerminal ? "8px 12px" : "10px 16px",
          borderRadius: isTerminal ? "4px" : "var(--radius-sm)",
          background: isTerminal ? "transparent" : "rgba(34,197,94,0.1)",
          border: `1px solid ${isTerminal ? "#32d74b" : "rgba(34,197,94,0.2)"}`,
          color: isTerminal ? "#32d74b" : "var(--success)",
          fontSize: "13px",
          marginBottom: "16px",
          fontFamily: "var(--font-body)",
        }}>
          {isTerminal ? `> ${success}` : success}
        </div>
      )}

      {/* Add Key Form */}
      {showAdd && (
        <form
          onSubmit={handleAdd}
          style={{
            padding: isTerminal ? "16px" : "24px",
            borderRadius: isTerminal ? "4px" : "var(--radius-lg)",
            border: `1px solid ${isTerminal ? "var(--border-accent)" : "var(--border-subtle)"}`,
            background: "var(--bg-card)",
            marginBottom: "24px",
          }}
        >
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "flex-end" }}>
            <div style={{ flex: "1 1 200px" }}>
              <label style={{ display: "block", marginBottom: "4px", color: "var(--text-secondary)", fontSize: isTerminal ? "11px" : "12px", fontFamily: "var(--font-body)", letterSpacing: isTerminal ? "1px" : "0.02em" }}>
                {isTerminal ? "SERVICE" : "Service name"}
              </label>
              <input
                type="text"
                value={newService}
                onChange={(e) => setNewService(e.target.value)}
                required
                placeholder={isTerminal ? "openai" : "e.g. openai, resend, stripe"}
                style={{
                  width: "100%",
                  padding: isTerminal ? "6px 10px" : "10px 14px",
                  borderRadius: isTerminal ? "3px" : "var(--radius-sm)",
                  border: "1px solid var(--border-medium)",
                  background: "var(--bg-input)",
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-body)",
                  fontSize: isTerminal ? "13px" : "14px",
                  outline: "none",
                }}
              />
            </div>
            <div style={{ flex: "2 1 300px" }}>
              <label style={{ display: "block", marginBottom: "4px", color: "var(--text-secondary)", fontSize: isTerminal ? "11px" : "12px", fontFamily: "var(--font-body)", letterSpacing: isTerminal ? "1px" : "0.02em" }}>
                {isTerminal ? "KEY" : "API Key"}
              </label>
              <input
                type="password"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                required
                placeholder="sk-..."
                style={{
                  width: "100%",
                  padding: isTerminal ? "6px 10px" : "10px 14px",
                  borderRadius: isTerminal ? "3px" : "var(--radius-sm)",
                  border: "1px solid var(--border-medium)",
                  background: "var(--bg-input)",
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-body)",
                  fontSize: isTerminal ? "13px" : "14px",
                  outline: "none",
                }}
              />
            </div>
            <button
              type="submit"
              style={{
                padding: isTerminal ? "6px 16px" : "10px 24px",
                borderRadius: isTerminal ? "3px" : "var(--radius-sm)",
                border: isTerminal ? "1px solid var(--border-accent)" : "none",
                background: isTerminal ? "transparent" : "#ffffff",
                color: isTerminal ? "var(--text-accent)" : "#000000",
                fontFamily: "var(--font-body)",
                fontSize: isTerminal ? "12px" : "13px",
                fontWeight: 600,
                cursor: "pointer",
                letterSpacing: isTerminal ? "1px" : "0",
                whiteSpace: "nowrap",
              }}
            >
              {isTerminal ? "STORE" : "Store Key"}
            </button>
          </div>
        </form>
      )}

      {/* Keys List */}
      {keys.length === 0 ? (
        <div style={{
          padding: isTerminal ? "20px" : "60px",
          textAlign: "center",
          color: "var(--text-tertiary)",
          fontFamily: "var(--font-body)",
          fontSize: isTerminal ? "13px" : "14px",
          border: isTerminal ? "none" : "1px dashed var(--border-subtle)",
          borderRadius: isTerminal ? "0" : "var(--radius-lg)",
        }}>
          {isTerminal ? (
            <>
              <div>No keys stored.</div>
              <div style={{ color: "var(--text-accent)", marginTop: "4px" }}>$ locker set &lt;service&gt; &lt;key&gt;</div>
            </>
          ) : (
            <>
              <p style={{ marginBottom: "8px" }}>No API keys stored yet</p>
              <p style={{ fontSize: "13px" }}>Click &quot;Add Key&quot; to store your first key</p>
            </>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: isTerminal ? "2px" : "8px" }}>
          {keys.map((k, i) => (
            <div
              key={k.service}
              className="animate-in"
              style={{
                animationDelay: `${i * 40}ms`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: isTerminal ? "8px 12px" : "16px 20px",
                borderRadius: isTerminal ? "3px" : "var(--radius-md)",
                border: `1px solid ${isTerminal ? "var(--border-subtle)" : "var(--border-subtle)"}`,
                background: "var(--bg-card)",
                transition: `all var(--duration-fast) ease`,
              }}
            >
              <div>
                <div style={{
                  fontFamily: "var(--font-body)",
                  fontSize: isTerminal ? "13px" : "15px",
                  fontWeight: 600,
                  color: isTerminal ? "var(--text-accent)" : "var(--text-primary)",
                  marginBottom: isTerminal ? "0" : "2px",
                }}>
                  {isTerminal ? `[${k.service}]` : k.service}
                </div>
                {!isTerminal && (
                  <div style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
                    Added {new Date(k.createdAt).toLocaleDateString()}
                    {k.lastUsed && ` \u2022 Last used ${new Date(k.lastUsed).toLocaleDateString()}`}
                  </div>
                )}
              </div>
              <button
                onClick={() => handleRevoke(k.service)}
                style={{
                  padding: isTerminal ? "2px 8px" : "4px 12px",
                  borderRadius: isTerminal ? "2px" : "var(--radius-sm)",
                  border: `1px solid ${isTerminal ? "#ff5f57" : "rgba(239,68,68,0.3)"}`,
                  background: "transparent",
                  color: isTerminal ? "#ff5f57" : "var(--error)",
                  fontFamily: "var(--font-body)",
                  fontSize: isTerminal ? "11px" : "12px",
                  cursor: "pointer",
                  letterSpacing: isTerminal ? "1px" : "0",
                }}
              >
                {isTerminal ? "DEL" : "Revoke"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
